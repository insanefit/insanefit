import { useState, useEffect, useMemo, type Dispatch, type SetStateAction } from 'react'
import {
  useAuthContext,
  useBillingCoachContext,
  useMetaContext,
  useTimerPortalContext,
  useTrainerContext,
  useWorkoutContext,
  type AppContextType,
} from '../../context/appContextStore'
import { RestTimer } from '../timer/RestTimer'
import { inferDemoMediaType } from '../../utils/urlUtils'
import type { ExerciseVideoAttachment } from '../../types/video'
import { getExerciseVideoAttachment } from '../../utils/exerciseUtils'
import { normalizeWorkoutDay, normalizeWorkoutRoutine } from '../../utils/workoutProtocol'

type ExerciseSeriesStep = {
  id: string
  label: string
  detail: string
  rest: string
}

type SeriesStepExecution = {
  done: boolean
  load: string
  reps: string
}

type SeriesProgressByStudent = Record<string, Record<string, Record<string, SeriesStepExecution>>>
type SeriesHistoryEntry = {
  id: string
  completedAt: string
  dateKey: string
  dateLabel: string
  routineDay: string
  exerciseKey: string
  exerciseName: string
  stepId: string
  stepLabel: string
  target: string
  load: string
  reps: string
}
type SeriesHistoryByStudent = Record<string, SeriesHistoryEntry[]>
type SeriesStepMeta = {
  exerciseName: string
  stepLabel: string
  target: string
  routineDay: string
}
const noThumbCacheValue = '__none__'
const youtubeThumbQualities = ['maxresdefault.jpg', 'sddefault.jpg', 'hqdefault.jpg', 'mqdefault.jpg', 'default.jpg'] as const
type YouTubeThumbQuality = (typeof youtubeThumbQualities)[number]
type ThumbnailCache = Record<string, YouTubeThumbQuality | typeof noThumbCacheValue>
type ExerciseThumbAsset =
  | { kind: 'none' }
  | { kind: 'video' }
  | { kind: 'image'; url: string }
  | { kind: 'youtube'; videoId: string }

type StudentFinanceSnapshot = {
  monthlyFee: number
  dueDay: number
  lastPaidMonth: string | null
  lastPaidAt: string | null
  pixKey: string
}

const toPositiveInt = (value: string, fallback: number): number => {
  const parsed = Number((value.match(/\d+/) || [])[0] || '')
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(Math.floor(parsed), 20)
}

const splitWarmupBlocks = (value: string): string[] =>
  value
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean)

const buildEmptySeriesStepExecution = (): SeriesStepExecution => ({
  done: false,
  load: '',
  reps: '',
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isThumbQuality = (value: string): value is YouTubeThumbQuality =>
  youtubeThumbQualities.includes(value as YouTubeThumbQuality)

const normalizeThumbnailCacheStore = (value: unknown): ThumbnailCache => {
  if (!isRecord(value)) return {}
  const normalized: ThumbnailCache = {}
  Object.entries(value).forEach(([videoId, quality]) => {
    if (typeof quality !== 'string') return
    if (quality === noThumbCacheValue || isThumbQuality(quality)) {
      normalized[videoId] = quality
    }
  })
  return normalized
}

const normalizeSeriesProgressStore = (value: unknown): SeriesProgressByStudent => {
  if (!isRecord(value)) return {}
  const normalizedByStudent: SeriesProgressByStudent = {}

  Object.entries(value).forEach(([studentId, exercises]) => {
    if (!isRecord(exercises)) return
    const normalizedByExercise: Record<string, Record<string, SeriesStepExecution>> = {}

    Object.entries(exercises).forEach(([exerciseKey, steps]) => {
      if (!isRecord(steps)) return
      const normalizedByStep: Record<string, SeriesStepExecution> = {}

      Object.entries(steps).forEach(([stepId, rawStep]) => {
        if (typeof rawStep === 'boolean') {
          normalizedByStep[stepId] = {
            ...buildEmptySeriesStepExecution(),
            done: rawStep,
          }
          return
        }

        if (!isRecord(rawStep)) {
          normalizedByStep[stepId] = buildEmptySeriesStepExecution()
          return
        }

        normalizedByStep[stepId] = {
          done: Boolean(rawStep.done),
          load: typeof rawStep.load === 'string' ? rawStep.load : '',
          reps: typeof rawStep.reps === 'string' ? rawStep.reps : '',
        }
      })

      normalizedByExercise[exerciseKey] = normalizedByStep
    })

    normalizedByStudent[studentId] = normalizedByExercise
  })

  return normalizedByStudent
}

const normalizeSeriesHistoryStore = (value: unknown): SeriesHistoryByStudent => {
  if (!isRecord(value)) return {}
  const normalized: SeriesHistoryByStudent = {}

  Object.entries(value).forEach(([studentId, rawEntries]) => {
    if (!Array.isArray(rawEntries)) return
    normalized[studentId] = rawEntries
      .filter((entry): entry is Record<string, unknown> => isRecord(entry))
      .map((entry) => ({
        id: typeof entry.id === 'string' ? entry.id : `${studentId}-${Date.now()}`,
        completedAt: typeof entry.completedAt === 'string' ? entry.completedAt : new Date().toISOString(),
        dateKey: typeof entry.dateKey === 'string' ? entry.dateKey : '',
        dateLabel: typeof entry.dateLabel === 'string' ? entry.dateLabel : '',
        routineDay: typeof entry.routineDay === 'string' ? entry.routineDay : '',
        exerciseKey: typeof entry.exerciseKey === 'string' ? entry.exerciseKey : '',
        exerciseName: typeof entry.exerciseName === 'string' ? entry.exerciseName : '',
        stepId: typeof entry.stepId === 'string' ? entry.stepId : '',
        stepLabel: typeof entry.stepLabel === 'string' ? entry.stepLabel : '',
        target: typeof entry.target === 'string' ? entry.target : '',
        load: typeof entry.load === 'string' ? entry.load : '',
        reps: typeof entry.reps === 'string' ? entry.reps : '',
      }))
      .filter((entry) => entry.exerciseKey && entry.stepId)
  })

  return normalized
}

const formatDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const formatDateLabel = (date: Date): string =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)

const parseNumericMetric = (value: string): number | null => {
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '')
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return null
  return parsed
}

const buildExerciseSeriesSteps = (
  exerciseName: string,
  protocol: AppContextType['parseWorkoutProtocolFromExercise'] extends (
    ...args: never[]
  ) => infer T
    ? T
    : never,
): ExerciseSeriesStep[] => {
  const warmupBlocks = splitWarmupBlocks(protocol.warmup || '')
  const feederSets = toPositiveInt(protocol.feederSets, 1)
  const workSets = toPositiveInt(protocol.workSets, 1)
  const myoMiniSets = toPositiveInt(protocol.myoMiniSets, 3)
  const baseRest = protocol.rest.trim() || '90s'
  const myoRest = protocol.myoRest.trim() || '5s'
  const keyBase = exerciseName.toLowerCase().replace(/\s+/g, '-')
  const steps: ExerciseSeriesStep[] = []

  warmupBlocks.forEach((block, index) => {
    steps.push({
      id: `${keyBase}-warmup-${index + 1}`,
      label: `Warm-up ${index + 1}`,
      detail: block,
      rest: baseRest,
    })
  })

  for (let index = 1; index <= feederSets; index += 1) {
    steps.push({
      id: `${keyBase}-feeder-${index}`,
      label: `Feeder ${index}`,
      detail: `${protocol.feederReps} reps @ RPE ${protocol.feederRpe}`,
      rest: baseRest,
    })
  }

  for (let index = 1; index <= workSets; index += 1) {
    steps.push({
      id: `${keyBase}-work-${index}`,
      label: `Work ${index}`,
      detail: `${protocol.workReps} reps @ RPE ${protocol.workRpe}`,
      rest: baseRest,
    })
  }

  if (protocol.useMyoReps) {
    for (let index = 1; index <= myoMiniSets; index += 1) {
      steps.push({
        id: `${keyBase}-myo-${index}`,
        label: `Myo mini-set ${index}`,
        detail: `${protocol.myoMiniReps} reps`,
        rest: myoRest,
      })
    }
  }

  return steps
}

const extractTargetReps = (step: ExerciseSeriesStep): string => {
  if (step.label.toLowerCase().includes('warm-up')) return step.detail
  const match = step.detail.match(/(\d+)\s*reps?/i)
  return match?.[1] ?? step.detail
}

const extractWorkoutDayFromNote = (note: string): string => {
  const match = note.match(/\b(?:day|dia)\s*:\s*([^|]+)/i)
  return normalizeWorkoutDay(match?.[1] ?? '')
}

const extractWorkoutRoutineFromNote = (note: string): string => {
  const match = note.match(/\b(?:routine|rotina|treino)\s*:\s*([^|]+)/i)
  const parsed = (match?.[1] ?? '').trim().toUpperCase()
  return parsed || 'A'
}

const extractYoutubeVideoId = (value: string): string | null => {
  const raw = value.trim()
  if (!raw) return null
  const embedMatch = raw.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/)
  if (embedMatch?.[1]) return embedMatch[1]
  const watchMatch = raw.match(/[?&]v=([a-zA-Z0-9_-]{6,})/)
  if (watchMatch?.[1]) return watchMatch[1]
  const shortMatch = raw.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/)
  if (shortMatch?.[1]) return shortMatch[1]
  const shortsMatch = raw.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/)
  if (shortsMatch?.[1]) return shortsMatch[1]
  return null
}

const buildYoutubeThumbCandidates = (videoId: string, cachedQuality?: YouTubeThumbQuality) => {
  const orderedQualities = cachedQuality
    ? [cachedQuality, ...youtubeThumbQualities.filter((quality) => quality !== cachedQuality)]
    : [...youtubeThumbQualities]
  return orderedQualities.map((quality) => ({
    quality,
    url: `https://i.ytimg.com/vi/${videoId}/${quality}`,
  }))
}

const resolveExerciseThumbnailAsset = (
  _exerciseName: string,
  _muscleGroup: string | undefined,
  customAttachment?: ExerciseVideoAttachment,
): ExerciseThumbAsset => {
  if (customAttachment) {
    const customUrl = customAttachment.rawUrl || customAttachment.embedUrl
    const mediaType = inferDemoMediaType(customUrl)
    if (mediaType === 'image') return { kind: 'image', url: customAttachment.embedUrl }
    if (mediaType === 'video') return { kind: 'video' }
    const videoId = extractYoutubeVideoId(customUrl) ?? extractYoutubeVideoId(customAttachment.embedUrl)
    if (videoId) return { kind: 'youtube', videoId }
    if (mediaType === 'iframe') return { kind: 'video' }
  }
  return { kind: 'none' }
}

const studentFinancePublicKey = 'insanefit:student-finance-public:v1'
const studentPixPublicKey = 'insanefit:student-pix-public:v1'

const normalizeStudentFinanceSnapshot = (value: unknown): StudentFinanceSnapshot | null => {
  if (!isRecord(value)) return null
  const monthlyFee = Number(value.monthlyFee)
  const dueDay = Number(value.dueDay)
  return {
    monthlyFee: Number.isFinite(monthlyFee) ? Math.max(0, monthlyFee) : 0,
    dueDay: Number.isFinite(dueDay) ? Math.max(1, Math.min(31, Math.round(dueDay))) : 10,
    lastPaidMonth: typeof value.lastPaidMonth === 'string' ? value.lastPaidMonth : null,
    lastPaidAt: typeof value.lastPaidAt === 'string' ? value.lastPaidAt : null,
    pixKey: typeof value.pixKey === 'string' ? value.pixKey : '',
  }
}

const readStudentFinanceSnapshot = (studentId: string): StudentFinanceSnapshot => {
  const fallback: StudentFinanceSnapshot = {
    monthlyFee: 0,
    dueDay: 10,
    lastPaidMonth: null,
    lastPaidAt: null,
    pixKey: '',
  }

  if (!studentId || typeof window === 'undefined') return fallback

  try {
    const rawPublicMap = window.localStorage.getItem(studentFinancePublicKey)
    const parsedPublicMap = rawPublicMap ? (JSON.parse(rawPublicMap) as Record<string, unknown>) : {}
    const publicEntry = normalizeStudentFinanceSnapshot(parsedPublicMap?.[studentId])
    const rawPix = window.localStorage.getItem(studentPixPublicKey) ?? ''
    const pixKey = rawPix.trim()

    return {
      ...fallback,
      ...(publicEntry ?? {}),
      pixKey: publicEntry?.pixKey?.trim() || pixKey,
    }
  } catch {
    return fallback
  }
}

const getFinanceStatus = (snapshot: StudentFinanceSnapshot): 'paid' | 'pending' | 'overdue' => {
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  if (snapshot.lastPaidMonth === monthKey) return 'paid'
  return now.getDate() > snapshot.dueDay ? 'overdue' : 'pending'
}

const clampDueDayToMonth = (year: number, monthIndex: number, dueDay: number): number =>
  Math.max(1, Math.min(dueDay, new Date(year, monthIndex + 1, 0).getDate()))

type ExerciseThumbButtonProps = {
  asset: ExerciseThumbAsset
  label: string
  onOpen: () => void
  thumbnailCache: ThumbnailCache
  setThumbnailCache: Dispatch<SetStateAction<ThumbnailCache>>
}

const ExerciseThumbButton = ({
  asset,
  label,
  onOpen,
  thumbnailCache,
  setThumbnailCache,
}: ExerciseThumbButtonProps) => {
  const cacheEntry = asset.kind === 'youtube' ? thumbnailCache[asset.videoId] : undefined
  const noThumbCached = cacheEntry === noThumbCacheValue
  const cachedQuality =
    asset.kind === 'youtube' && cacheEntry && cacheEntry !== noThumbCacheValue
      ? cacheEntry
      : undefined
  const thumbCandidates = asset.kind === 'youtube' ? buildYoutubeThumbCandidates(asset.videoId, cachedQuality) : []
  const [candidateIndex, setCandidateIndex] = useState(0)
  const [imageFailed, setImageFailed] = useState(false)

  const activeCandidate = thumbCandidates[Math.min(candidateIndex, Math.max(thumbCandidates.length - 1, 0))]
  const showImage =
    asset.kind === 'image'
      ? !imageFailed
      : asset.kind === 'youtube'
        ? !noThumbCached && Boolean(activeCandidate)
        : false

  return (
    <button
      type="button"
      className={showImage ? 'exercise-thumb' : 'exercise-thumb exercise-thumb-fallback'}
      onClick={onOpen}
      aria-label={label}
    >
      {asset.kind === 'image' && showImage && (
        <img
          src={asset.url}
          alt=""
          className="exercise-thumb-image"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      )}

      {asset.kind === 'youtube' && showImage && activeCandidate && (
        <img
          src={activeCandidate.url}
          alt=""
          className="exercise-thumb-image"
          loading="lazy"
          onLoad={() => {
            setThumbnailCache((current) => {
              if (current[asset.videoId] === activeCandidate.quality) return current
              return {
                ...current,
                [asset.videoId]: activeCandidate.quality,
              }
            })
          }}
          onError={() => {
            if (candidateIndex < thumbCandidates.length - 1) {
              setCandidateIndex((current) => current + 1)
              return
            }
            setThumbnailCache((current) => {
              if (current[asset.videoId] === noThumbCacheValue) return current
              return {
                ...current,
                [asset.videoId]: noThumbCacheValue,
              }
            })
          }}
        />
      )}

      {!showImage && (
        <span className="exercise-thumb-empty">{asset.kind === 'video' ? 'VIDEO' : 'SEM MIDIA'}</span>
      )}
      {asset.kind !== 'none' && <span className="exercise-thumb-play">▶</span>}
    </button>
  )
}

export function StudentPortal() {
  const { handleSignOut } = useAuthContext()
  const {
    studentPortal,
    syncMessage,
    hasTrainerWorkspace,
    doneSessions,
    setSyncMessage,
    selectedDay,
    setSelectedDay,
    toggleSession,
    setAppMode,
  } = useTrainerContext()
  const {
    studentPortalWeekSessions,
    studentVideoExerciseName,
    setStudentVideoExerciseName,
    studentDemoModelIndex,
    setStudentDemoModelIndex,
    studentDemoContext,
    applyRestTimer,
  } = useTimerPortalContext()
  const { coachProfile } = useBillingCoachContext()
  const { exerciseVideoMap } = useWorkoutContext()
  const {
    weekDays,
    renderDemoMedia,
    getExerciseDisplayName,
    getStudentTrainingLevel,
    getStudentWorkoutType,
    parseWorkoutProtocolFromExercise,
    getExerciseRestPreset,
    findLibraryExerciseByName,
  } = useMetaContext()

  const progressStorageKey = 'insanefit-series-progress'
  const progressHistoryStorageKey = 'insanefit-series-history'
  const thumbnailStorageKey = 'insanefit-thumb-cache-v1'
  const [seriesProgressByStudent, setSeriesProgressByStudent] = useState<SeriesProgressByStudent>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const raw = window.localStorage.getItem(progressStorageKey)
      return raw ? normalizeSeriesProgressStore(JSON.parse(raw)) : {}
    } catch {
      return {}
    }
  })
  const [thumbnailCache, setThumbnailCache] = useState<ThumbnailCache>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const raw = window.localStorage.getItem(thumbnailStorageKey)
      return raw ? normalizeThumbnailCacheStore(JSON.parse(raw)) : {}
    } catch {
      return {}
    }
  })
  const [seriesHistoryByStudent, setSeriesHistoryByStudent] = useState<SeriesHistoryByStudent>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const raw = window.localStorage.getItem(progressHistoryStorageKey)
      return raw ? normalizeSeriesHistoryStore(JSON.parse(raw)) : {}
    } catch {
      return {}
    }
  })
  const [collapsedExercises, setCollapsedExercises] = useState<Record<string, boolean>>({})

  const studentId = studentPortal?.student.id ?? ''
  const exerciseSeriesProgress = studentId ? (seriesProgressByStudent[studentId] ?? {}) : {}
  const seriesHistory = useMemo(
    () => (studentId ? (seriesHistoryByStudent[studentId] ?? []) : []),
    [seriesHistoryByStudent, studentId],
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(progressStorageKey, JSON.stringify(seriesProgressByStudent))
  }, [seriesProgressByStudent])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(thumbnailStorageKey, JSON.stringify(thumbnailCache))
  }, [thumbnailCache])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(progressHistoryStorageKey, JSON.stringify(seriesHistoryByStudent))
  }, [seriesHistoryByStudent, progressHistoryStorageKey])

  const toggleSeriesStep = (exerciseKey: string, stepId: string, stepMeta?: SeriesStepMeta) => {
    if (!studentId) return
    let nextDone = false
    let stepSnapshot = buildEmptySeriesStepExecution()

    setSeriesProgressByStudent((current) => {
      const studentMap = current[studentId] ?? {}
      const exerciseMap = studentMap[exerciseKey] ?? {}
      const currentStep = exerciseMap[stepId] ?? buildEmptySeriesStepExecution()
      stepSnapshot = currentStep
      nextDone = !currentStep.done

      return {
        ...current,
        [studentId]: {
          ...studentMap,
          [exerciseKey]: {
            ...exerciseMap,
            [stepId]: {
              ...currentStep,
              done: !currentStep.done,
            },
          },
        },
      }
    })

    if (!nextDone || !stepMeta) return

    const now = new Date()
    const dateKey = formatDateKey(now)
    const dateLabel = formatDateLabel(now)

    setSeriesHistoryByStudent((current) => {
      const studentEntries = current[studentId] ?? []
      const duplicate = studentEntries.some(
        (entry) =>
          entry.dateKey === dateKey &&
          entry.exerciseKey === exerciseKey &&
          entry.stepId === stepId,
      )
      if (duplicate) return current

      const nextEntry: SeriesHistoryEntry = {
        id: `${studentId}-${exerciseKey}-${stepId}-${now.getTime()}`,
        completedAt: now.toISOString(),
        dateKey,
        dateLabel,
        routineDay: stepMeta.routineDay,
        exerciseKey,
        exerciseName: stepMeta.exerciseName,
        stepId,
        stepLabel: stepMeta.stepLabel,
        target: stepMeta.target,
        load: stepSnapshot.load.trim(),
        reps: stepSnapshot.reps.trim(),
      }

      return {
        ...current,
        [studentId]: [nextEntry, ...studentEntries].slice(0, 1200),
      }
    })
  }

  const updateSeriesStepMetric = (
    exerciseKey: string,
    stepId: string,
    field: 'load' | 'reps',
    value: string,
  ) => {
    if (!studentId) return
    setSeriesProgressByStudent((current) => {
      const studentMap = current[studentId] ?? {}
      const exerciseMap = studentMap[exerciseKey] ?? {}
      const currentStep = exerciseMap[stepId] ?? buildEmptySeriesStepExecution()
      return {
        ...current,
        [studentId]: {
          ...studentMap,
          [exerciseKey]: {
            ...exerciseMap,
            [stepId]: {
              ...currentStep,
              [field]: value,
            },
          },
        },
      }
    })
  }

  const resetSeriesProgress = (exerciseKey: string) => {
    if (!studentId) return
    setSeriesProgressByStudent((current) => ({
      ...current,
      [studentId]: {
        ...(current[studentId] ?? {}),
        [exerciseKey]: {},
      },
    }))
  }

  const finishNextSeriesStep = (exerciseKey: string, steps: ExerciseSeriesStep[]) => {
    if (!studentId) return
    const nextStep = steps.find((step) => !(exerciseSeriesProgress[exerciseKey]?.[step.id]?.done))
    if (!nextStep) return
    const exerciseName = exerciseKey.split('::')[0] || 'Exercicio'
    toggleSeriesStep(exerciseKey, nextStep.id, {
      exerciseName,
      stepLabel: nextStep.label,
      target: extractTargetReps(nextStep),
      routineDay: activeRoutine?.day ?? selectedDay,
    })
  }

  const [studentTab, setStudentTab] = useState<'inicio' | 'treino' | 'agenda' | 'financeiro' | 'historico' | 'progresso'>('inicio')
  const [selectedRoutineDay, setSelectedRoutineDay] = useState('')
  const sessionByDay = useMemo(
    () =>
      weekDays
        .map((day) => {
          const sessions = (studentPortal?.sessions ?? []).filter((session) => session.day === day)
          const doneCount = sessions.filter((session) => doneSessions.includes(session.id)).length
          const focusLabel = Array.from(new Set(sessions.map((session) => session.focus.trim()).filter(Boolean))).join(' • ')
          return {
            day,
            sessions,
            doneCount,
            totalCount: sessions.length,
            focusLabel: focusLabel || 'Treino personalizado',
          }
        })
        .filter((item) => item.totalCount > 0),
    [doneSessions, studentPortal?.sessions, weekDays],
  )

  const studentName = studentPortal?.student.name ?? ''
  const studentFirstName = studentName.split(' ')[0] || studentName
  const coachDisplayName = coachProfile.displayName.trim() || 'Coach Insane'
  const coachTitle = coachProfile.title.trim() || 'Personal Trainer'
  const weeklyDoneCount = doneSessions.filter((id) => (studentPortal?.sessions ?? []).some((session) => session.id === id)).length
  const hasSelectedRoutine = sessionByDay.some((item) => item.day === selectedRoutineDay)
  const effectiveRoutineDay = (hasSelectedRoutine ? selectedRoutineDay : '') || sessionByDay[0]?.day || selectedDay
  const activeRoutine = sessionByDay.find((item) => item.day === effectiveRoutineDay) ?? null
  const activeRoutineDay = activeRoutine?.day ?? ''
  const allWorkout = studentPortal?.workout ?? []
  const targetRoutineDay = normalizeWorkoutDay(activeRoutineDay)
  const activeRoutineWorkout = targetRoutineDay
    ? allWorkout.filter((exercise) => {
      const exerciseDay = normalizeWorkoutDay(exercise.day ?? '') || extractWorkoutDayFromNote(exercise.note)
      return !exerciseDay || exerciseDay === targetRoutineDay
    })
    : allWorkout
  const activeStudentVideoExerciseName =
    studentVideoExerciseName || activeRoutineWorkout[0]?.name || studentPortal?.workout[0]?.name || ''
  const studentFinance = studentPortal?.finance
    ? {
        monthlyFee: studentPortal.finance.monthlyFee,
        dueDay: studentPortal.finance.dueDay,
        lastPaidMonth: studentPortal.finance.lastPaidMonth,
        lastPaidAt: studentPortal.finance.lastPaidAt,
        pixKey: studentPortal.finance.pixKey,
      }
    : readStudentFinanceSnapshot(studentPortal?.student.id ?? '')
  const financeStatus = studentPortal?.finance?.paymentStatus ?? getFinanceStatus(studentFinance)
  const financeStatusLabel = financeStatus === 'paid' ? 'Pago' : financeStatus === 'overdue' ? 'Atrasado' : 'Pendente'
  const studentPixValue = studentFinance.pixKey.trim()
  const financeNow = new Date()
  const safeDueDay = clampDueDayToMonth(financeNow.getFullYear(), financeNow.getMonth(), studentFinance.dueDay)
  const dueDate = new Date(financeNow.getFullYear(), financeNow.getMonth(), safeDueDay)
  const todayStart = new Date(financeNow.getFullYear(), financeNow.getMonth(), financeNow.getDate())
  const dayDiff = Math.round((dueDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24))
  const financeDueHint =
    financeStatus === 'paid'
      ? 'Mensalidade do mês em dia.'
      : dayDiff === 0
        ? 'Vence hoje.'
        : dayDiff > 0
          ? `Vence em ${dayDiff} dia${dayDiff > 1 ? 's' : ''}.`
          : `Atrasado há ${Math.abs(dayDiff)} dia${Math.abs(dayDiff) > 1 ? 's' : ''}.`
  const collapseKeys = activeRoutineWorkout.map(
    (exercise, exerciseIndex) => `${studentPortal?.student.id ?? ''}::${exercise.name}::${exerciseIndex}`,
  )
  const historyGroupedByDate = useMemo(() => {
    const grouped = new Map<string, { dateLabel: string; entries: SeriesHistoryEntry[] }>()
    seriesHistory.forEach((entry) => {
      const current = grouped.get(entry.dateKey)
      if (current) {
        current.entries.push(entry)
      } else {
        grouped.set(entry.dateKey, { dateLabel: entry.dateLabel, entries: [entry] })
      }
    })

    return Array.from(grouped.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([dateKey, data]) => ({
        dateKey,
        dateLabel: data.dateLabel,
        entries: data.entries.sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1)),
      }))
  }, [seriesHistory])

  const progressTrend = useMemo(() => {
    const labels: Array<{ key: string; short: string; full: string }> = []
    const now = new Date()
    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date(now)
      date.setDate(now.getDate() - index)
      labels.push({
        key: formatDateKey(date),
        short: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date).replace('.', ''),
        full: formatDateLabel(date),
      })
    }

    const perDay = labels.map((item) => {
      const entries = seriesHistory.filter((entry) => entry.dateKey === item.key)
      const totalLoad = entries.reduce((acc, entry) => acc + (parseNumericMetric(entry.load) ?? 0), 0)
      const totalReps = entries.reduce((acc, entry) => acc + (parseNumericMetric(entry.reps) ?? 0), 0)
      return {
        ...item,
        completions: entries.length,
        totalLoad,
        totalReps,
      }
    })

    const maxCompletions = Math.max(1, ...perDay.map((item) => item.completions))
    return { perDay, maxCompletions }
  }, [seriesHistory])

  const topExercises = useMemo(() => {
    const byExercise = new Map<string, { name: string; count: number; load: number }>()
    seriesHistory.forEach((entry) => {
      const key = entry.exerciseName || entry.exerciseKey
      const current = byExercise.get(key) ?? { name: entry.exerciseName || key, count: 0, load: 0 }
      current.count += 1
      current.load += parseNumericMetric(entry.load) ?? 0
      byExercise.set(key, current)
    })

    return Array.from(byExercise.values())
      .sort((a, b) => (a.count === b.count ? b.load - a.load : b.count - a.count))
      .slice(0, 5)
  }, [seriesHistory])

  if (!studentPortal) return null

  const handleCopyStudentPix = async () => {
    if (!studentPixValue) {
      setSyncMessage('Chave PIX ainda não foi informada pelo personal.')
      return
    }
    try {
      await navigator.clipboard.writeText(studentPixValue)
      setSyncMessage('Chave PIX copiada.')
    } catch {
      setSyncMessage('Não foi possível copiar a chave PIX agora.')
    }
  }

  return (
    <div className="student-portal-shell">
      <header className="student-hero">
        <div className="student-hero-top">
          <img src="/if-brand-full.png" alt="Insane Fit" className="student-hero-logo" />
          <button type="button" className="btn-ghost student-hero-signout" onClick={handleSignOut}>
            Sair
          </button>
        </div>

        <div className="student-coach-row">
          {coachProfile.avatarUrl ? (
            <img src={coachProfile.avatarUrl} alt={coachDisplayName} className="student-coach-avatar" />
          ) : (
            <div className="student-coach-avatar student-coach-avatar-fallback">{coachDisplayName.charAt(0)}</div>
          )}
          <div>
            <strong>{coachDisplayName}</strong>
            <p>{coachTitle}</p>
          </div>
        </div>

        <div className="student-hero-copy">
          <h2>Bom treino, {studentFirstName}!</h2>
          <p>
            Objetivo: {getStudentWorkoutType(studentPortal.student)} • Nível {getStudentTrainingLevel(studentPortal.student)}
          </p>
        </div>
      </header>

      <main className="student-portal-content">
        {syncMessage && <p className="status-line">{syncMessage}</p>}

        {studentTab === 'inicio' && (
          <>
            <section className="student-frequency-card">
              <div className="panel-head">
                <h3>Frequência da semana</h3>
                <p>{weeklyDoneCount}/{studentPortal.sessions.length} aulas concluídas</p>
              </div>
              <div className="student-frequency-track">
                {weekDays.map((day) => {
                  const sessions = studentPortal.sessions.filter((session) => session.day === day)
                  const doneCount = sessions.filter((session) => doneSessions.includes(session.id)).length
                  const done = sessions.length > 0 && doneCount === sessions.length
                  const partial = doneCount > 0 && !done
                  return (
                    <div key={`freq-${day}`} className="student-frequency-step">
                      <span className={done ? 'freq-dot done' : partial ? 'freq-dot partial' : 'freq-dot'}>
                        {done ? '✓' : day.slice(0, 1).toUpperCase()}
                      </span>
                      <small>{day.slice(0, 3)}</small>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="student-shortcuts">
              <button type="button" className="shortcut-card" onClick={() => setStudentTab('treino')}>
                <strong>Treinos</strong>
                <span>Abrir rotina e marcar séries</span>
              </button>
              <button
                type="button"
                className="shortcut-card"
                onClick={() => {
                  setStudentTab('agenda')
                  if (effectiveRoutineDay) setSelectedDay(effectiveRoutineDay)
                }}
              >
                <strong>Agenda</strong>
                <span>Marcar sessões da semana</span>
              </button>
              <button
                type="button"
                className="shortcut-card"
                onClick={() => {
                  setStudentTab('progresso')
                  if (activeRoutine) {
                    setSelectedRoutineDay(activeRoutine.day)
                    setSelectedDay(activeRoutine.day)
                  }
                }}
              >
                <strong>Meu progresso</strong>
                <span>Ver evolução do treino atual</span>
              </button>
              <button type="button" className="shortcut-card" onClick={() => setStudentTab('financeiro')}>
                <strong>Financeiro</strong>
                <span>PIX e status do pagamento</span>
              </button>
              {hasTrainerWorkspace && (
                <button type="button" className="shortcut-card" onClick={() => setAppMode('trainer')}>
                  <strong>Painel do personal</strong>
                  <span>Voltar para gestão</span>
                </button>
              )}
            </section>
          </>
        )}

      {studentTab === 'inicio' && (
          <section className="panel student-routines-panel">
            <div className="panel-head">
              <h3>Rotinas de treino</h3>
              <p>Fluxo simples para o aluno: abrir treino, executar e marcar séries.</p>
            </div>

            <div className="student-routines-list">
              {sessionByDay.length === 0 && (
                <p className="empty-line">Seu personal ainda não cadastrou rotinas por dia.</p>
              )}
              {sessionByDay.map((routine) => (
                <article
                  key={`routine-${routine.day}`}
                  className={effectiveRoutineDay === routine.day ? 'student-routine-card active' : 'student-routine-card'}
                >
                  <div className="student-routine-head">
                    <strong>{routine.day}</strong>
                    <span>{routine.doneCount}/{routine.totalCount} concluídos</span>
                  </div>
                  <p>{routine.focusLabel}</p>
                  <div className="student-routine-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setStudentTab('historico')
                        setSelectedRoutineDay(routine.day)
                        setSelectedDay(routine.day)
                      }}
                    >
                      Histórico
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setStudentTab('progresso')
                        setSelectedRoutineDay(routine.day)
                        setSelectedDay(routine.day)
                      }}
                    >
                      Evolução
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn-primary student-routine-main"
                    onClick={() => {
                      setStudentTab('treino')
                      setSelectedRoutineDay(routine.day)
                      setSelectedDay(routine.day)
                    }}
                  >
                    Ver treino
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {studentTab === 'treino' && (
          <>
            <RestTimer />

            <section className="panel student-workout-panel">
              <div className="panel-head">
                <div>
                  <h3>Treino {activeRoutine?.day ?? ''}</h3>
                  <p>{activeRoutine?.focusLabel ?? 'Prescrição atualizada pelo personal'}</p>
                </div>
                <div className="student-workout-head-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() =>
                      setCollapsedExercises((current) => {
                        const next = { ...current }
                        collapseKeys.forEach((key) => {
                          next[key] = true
                        })
                        return next
                      })
                    }
                    disabled={collapseKeys.length === 0}
                  >
            Recolher todos
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() =>
                      setCollapsedExercises((current) => {
                        const next = { ...current }
                        collapseKeys.forEach((key) => {
                          next[key] = false
                        })
                        return next
                      })
                    }
                    disabled={collapseKeys.length === 0}
                  >
                    Expandir todos
                  </button>
                </div>
              </div>
              <div className="exercise-list">
                {activeRoutineWorkout.length === 0 && (
                  <p className="empty-line">Seu personal ainda não publicou um treino para você.</p>
                )}
                {activeRoutineWorkout.map((exercise, exerciseIndex) => {
                  const source = findLibraryExerciseByName(exercise.name)
                  const isVideoSelected =
                    studentDemoContext?.exerciseName === exercise.name ||
                    (!studentDemoContext && activeStudentVideoExerciseName === exercise.name)
                  const protocol = parseWorkoutProtocolFromExercise(
                    exercise,
                    source?.muscleGroup ?? 'Funcional',
                  )
                  const exerciseRoutine = normalizeWorkoutRoutine(
                    exercise.routine ?? extractWorkoutRoutineFromNote(exercise.note),
                  )
                  const restPreset = getExerciseRestPreset(exercise)
                  const workSummary = `${protocol.workSets} x ${protocol.workReps} @ RPE ${protocol.workRpe}`
                  const feederSummary = `${protocol.feederSets} x ${protocol.feederReps} @ RPE ${protocol.feederRpe}`
                  const exerciseKey = `${exercise.name}::${exerciseIndex}::${studentPortal.student.id}`
                  const collapseKey = `${studentPortal.student.id}::${exercise.name}::${exerciseIndex}`
                  const isCollapsed = collapsedExercises[collapseKey] ?? false
                  const seriesSteps = buildExerciseSeriesSteps(exercise.name, protocol)
                  const videoAttachment = getExerciseVideoAttachment(exercise.name, exerciseVideoMap)
                  const exerciseThumbAsset = resolveExerciseThumbnailAsset(
                    exercise.name,
                    source?.muscleGroup,
                    videoAttachment,
                  )
                  const completedSteps = seriesSteps.filter(
                    (step) => exerciseSeriesProgress[exerciseKey]?.[step.id]?.done,
                  ).length
                  const isSeriesDone = seriesSteps.length > 0 && completedSteps === seriesSteps.length
                  const nextStepNumber = Math.min(completedSteps + 1, Math.max(seriesSteps.length, 1))

                  return (
                    <div
                      key={`${exercise.name}-${exerciseIndex}`}
                      className={isVideoSelected ? 'exercise-row selected' : 'exercise-row'}
                    >
                      <div className="exercise-card-head">
                        <ExerciseThumbButton
                          key={`thumb-${exercise.name}-${
                            exerciseThumbAsset.kind === 'youtube'
                              ? exerciseThumbAsset.videoId
                              : exerciseThumbAsset.kind === 'image'
                                ? exerciseThumbAsset.url
                                : 'none'
                          }`}
                          asset={exerciseThumbAsset}
                          label={`Ver demonstração de ${getExerciseDisplayName(exercise.name)}`}
                          onOpen={() => {
                            setCollapsedExercises((current) => ({
                              ...current,
                              [collapseKey]: false,
                            }))
                            setStudentVideoExerciseName(exercise.name)
                            setStudentDemoModelIndex(0)
                          }}
                          thumbnailCache={thumbnailCache}
                          setThumbnailCache={setThumbnailCache}
                        />
                        <div className="exercise-head-copy">
                          <p className="exercise-head-kicker">Exercício {exerciseIndex + 1}</p>
                          <strong>{getExerciseDisplayName(exercise.name)}</strong>
                          <span className="exercise-head-meta">
                            Treino {exerciseRoutine} • {source?.muscleGroup ?? 'Funcional'} - {source?.equipment ?? 'Livre'}
                          </span>
                          <p className="exercise-head-note">{protocol.note || 'Sem observação do personal.'}</p>
                        </div>
                        <div className="exercise-card-progress-wrap">
                          <div className="exercise-card-progress">
                            {isSeriesDone ? '✓' : `${completedSteps}/${seriesSteps.length}`}
                          </div>
                          <button
                            type="button"
                            className="exercise-collapse-toggle"
                            onClick={() =>
                              setCollapsedExercises((current) => ({
                                ...current,
                                [collapseKey]: !isCollapsed,
                              }))
                            }
                            aria-label={isCollapsed ? 'Expandir exercício' : 'Recolher exercício'}
                            title={isCollapsed ? 'Expandir exercício' : 'Recolher exercício'}
                          >
                            {isCollapsed ? '▸' : '▾'}
                          </button>
                        </div>
                      </div>

                      {!isCollapsed && (
                        <>
                          <span>Work {workSummary}</span>
                          <p className="protocol-line">Warm-up: {protocol.warmup} | Feeder: {feederSummary}</p>
                          {protocol.useMyoReps && (
                            <p className="protocol-line myo">
                              Myo-reps: mini {protocol.myoMiniSets} x {protocol.myoMiniReps} (rest {protocol.myoRest})
                            </p>
                          )}
                          <div className="exercise-row-actions">
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() =>
                                applyRestTimer(restPreset, `Descanso ${getExerciseDisplayName(exercise.name)}`, true)
                              }
                            >
                              Iniciar descanso ({restPreset})
                            </button>
                            {protocol.useMyoReps && (
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() =>
                                  applyRestTimer(protocol.myoRest, `Myo-reps ${getExerciseDisplayName(exercise.name)}`, true)
                                }
                              >
                                Descanso myo ({protocol.myoRest})
                              </button>
                            )}
                          </div>

                          {seriesSteps.length > 0 && (
                            <div className="series-tracker">
                              <div className="series-tracker-head">
                                <p>Progresso de séries</p>
                                <strong>
                                  {completedSteps}/{seriesSteps.length}
                                </strong>
                              </div>

                              <div className="series-grid-header">
                                <span>Série</span>
                                <span>Repetições</span>
                                <span>Carga (kg)</span>
                                <span>Reps feitas</span>
                                <span>Estado</span>
                              </div>

                              <div className="series-step-list">
                                {seriesSteps.map((step, stepIndex) => {
                                  const stepProgress =
                                    exerciseSeriesProgress[exerciseKey]?.[step.id] ?? buildEmptySeriesStepExecution()
                                  const isMarked = Boolean(stepProgress.done)
                                  const targetReps = extractTargetReps(step)
                                  return (
                                    <div key={step.id} className={isMarked ? 'series-step done' : 'series-step'}>
                                      <span className="series-order-badge">{stepIndex + 1}a</span>
                                      <span className="series-target-reps">{targetReps}</span>
                                      <label className="series-step-input">
                                        <input
                                          type="text"
                                          inputMode="decimal"
                                          placeholder="kg"
                                          value={stepProgress.load}
                                          onChange={(event) =>
                                            updateSeriesStepMetric(exerciseKey, step.id, 'load', event.target.value)
                                          }
                                        />
                                      </label>
                                      <label className="series-step-input">
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          placeholder="reps"
                                          value={stepProgress.reps}
                                          onChange={(event) =>
                                            updateSeriesStepMetric(exerciseKey, step.id, 'reps', event.target.value)
                                          }
                                        />
                                      </label>
                                      <button
                                        type="button"
                                        className={isMarked ? 'series-state-toggle done' : 'series-state-toggle'}
                                        onClick={() =>
                                          toggleSeriesStep(exerciseKey, step.id, {
                                            exerciseName: exercise.name,
                                            stepLabel: step.label,
                                            target: targetReps,
                                            routineDay: activeRoutine?.day ?? selectedDay,
                                          })
                                        }
                                        aria-label={isMarked ? 'Série marcada' : 'Marcar série'}
                                      >
                                        {isMarked ? '✓' : ''}
                                      </button>
                                      <button
                                        type="button"
                                        className="series-rest-btn"
                                        onClick={() =>
                                          applyRestTimer(
                                            step.rest,
                                            `Descanso ${step.label} - ${getExerciseDisplayName(exercise.name)}`,
                                            true,
                                          )
                                        }
                                      >
                                        Descanso {step.rest}
                                      </button>
                                    </div>
                                  )
                                })}
                              </div>

                              <div className="series-tracker-footer">
                                <button
                                  type="button"
                                  className="btn-primary series-main-action"
                                  onClick={() => finishNextSeriesStep(exerciseKey, seriesSteps)}
                                  disabled={isSeriesDone}
                                >
                                  {isSeriesDone ? 'Exercício concluído' : `Finalizar série ${nextStepNumber}`}
                                </button>
                                <button
                                  type="button"
                                  className="btn-ghost"
                                  onClick={() => resetSeriesProgress(exerciseKey)}
                                >
                                  Limpar marcações
                                </button>
                                {isSeriesDone && <span className="series-complete-chip">Exercício concluído</span>}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              {studentDemoContext && (
                <div className="student-demo-panel">
                  <div className="panel-head">
                    <h3>Vídeo guiado do aluno</h3>
                    <p>{getExerciseDisplayName(studentDemoContext.exerciseName)}</p>
                  </div>
                  {studentDemoContext.options.length > 1 && (
                    <div className="demo-model-tabs">
                      {studentDemoContext.options.map((option, index) => (
                        <button
                          key={`student-${option.id}-${index}`}
                          type="button"
                          className={index === studentDemoModelIndex ? 'tab-chip active' : 'tab-chip'}
                          onClick={() => setStudentDemoModelIndex(index)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {studentDemoContext.activeOption && (
                    <p className="demo-query">
                      Video de execução configurado pelo personal.
                      {studentDemoContext.activeOption.licenseLabel
                        ? ` Fonte: ${studentDemoContext.activeOption.licenseLabel}.`
                        : ''}
                    </p>
                  )}
                  {renderDemoMedia(
                    studentDemoContext.activeOption,
                    `Video ${getExerciseDisplayName(studentDemoContext.exerciseName)}`,
                  )}
                  {studentDemoContext.activeOption?.source === 'custom' &&
                    studentDemoContext.activeOption.rawUrl && (
                      <a
                        className="demo-link"
                        href={studentDemoContext.activeOption.rawUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Abrir arquivo original
                      </a>
                    )}
                  {!studentDemoContext.activeOption && (
                    <p className="demo-query">
                      Este exercício ainda não possui video configurado.
                    </p>
                  )}
                </div>
              )}
            </section>
          </>
        )}

        {studentTab === 'historico' && (
          <section className="panel student-history-panel">
            <div className="panel-head">
              <h3>Histórico de execução</h3>
              <p>Séries concluídas com carga e repetições por data</p>
            </div>

            {historyGroupedByDate.length === 0 && (
              <p className="empty-line">Sem histórico ainda. Marque as séries no treino para começar.</p>
            )}

            <div className="student-history-list">
              {historyGroupedByDate.map((group) => (
                <article key={group.dateKey} className="student-history-day">
                  <div className="student-history-day-head">
                    <strong>{group.dateLabel}</strong>
                    <span>{group.entries.length} séries concluídas</span>
                  </div>
                  <div className="student-history-entry-list">
                    {group.entries.map((entry) => (
                      <div key={entry.id} className="student-history-entry">
                        <div>
                          <strong>{getExerciseDisplayName(entry.exerciseName)}</strong>
                          <p>{entry.stepLabel} • alvo {entry.target}</p>
                        </div>
                        <div className="student-history-metrics">
                          <span>{entry.load || '-'} kg</span>
                          <span>{entry.reps || '-'} reps</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {studentTab === 'progresso' && (
          <section className="panel student-progress-panel">
            <div className="panel-head">
              <h3>Meu progresso</h3>
              <p>Evolução dos últimos 7 dias</p>
            </div>

            <div className="student-progress-chart">
              {progressTrend.perDay.map((item) => (
                <div key={item.key} className="student-progress-bar-col">
                  <div
                    className="student-progress-bar"
                    style={{
                      height: `${Math.max(8, (item.completions / progressTrend.maxCompletions) * 100)}%`,
                    }}
                    title={`${item.full}: ${item.completions} séries`}
                  />
                  <span>{item.short}</span>
                  <small>{item.completions}</small>
                </div>
              ))}
            </div>

            <div className="student-progress-stats">
              <div className="detail-block">
                <span>Séries (7d)</span>
                <strong>{progressTrend.perDay.reduce((sum, item) => sum + item.completions, 0)}</strong>
              </div>
              <div className="detail-block">
                <span>Carga total (7d)</span>
                <strong>
                  {progressTrend.perDay.reduce((sum, item) => sum + item.totalLoad, 0).toFixed(1)} kg
                </strong>
              </div>
              <div className="detail-block">
                <span>Repetições (7d)</span>
                <strong>{progressTrend.perDay.reduce((sum, item) => sum + item.totalReps, 0)}</strong>
              </div>
            </div>

            <div className="student-progress-top">
              <h4>Exercícios mais executados</h4>
              {topExercises.length === 0 && <p className="empty-line">Sem dados suficientes no momento.</p>}
              {topExercises.map((item) => (
                <div key={item.name} className="student-progress-top-row">
                  <strong>{getExerciseDisplayName(item.name)}</strong>
                  <span>{item.count} séries</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {studentTab === 'financeiro' && (
          <section className="panel student-finance-panel">
            <div className="panel-head">
              <h3>Financeiro</h3>
              <p>Acompanhe mensalidade e pagamento</p>
            </div>

            <div className="student-finance-grid">
              <div className="detail-block">
                <span>Status</span>
                <strong className={`student-finance-status ${financeStatus}`}>{financeStatusLabel}</strong>
              </div>
              <div className="detail-block">
                <span>Mensalidade</span>
                <strong>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    studentFinance.monthlyFee,
                  )}
                </strong>
              </div>
              <div className="detail-block">
                <span>Vencimento</span>
                <strong>Dia {String(studentFinance.dueDay).padStart(2, '0')}</strong>
              </div>
              <div className="detail-block full">
                <span>Chave PIX do personal</span>
                <strong>{studentPixValue || 'Ainda nao informada pelo personal.'}</strong>
              </div>
            </div>
            <p className={`student-finance-note ${financeStatus}`}>{financeDueHint}</p>

            <div className="student-finance-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  void handleCopyStudentPix()
                }}
              >
                Copiar chave PIX
              </button>
            </div>
          </section>
        )}

        {studentTab === 'agenda' && (
          <section className="panel">
            <div className="panel-head">
              <h3>Minha agenda</h3>
              <p>Marque as aulas realizadas</p>
            </div>

            <div className="tab-row">
              {weekDays.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={day === selectedDay ? 'tab-chip active' : 'tab-chip'}
                  onClick={() => setSelectedDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="session-list">
              {studentPortalWeekSessions.length === 0 && <p className="empty-line">Sem aulas nesse dia.</p>}

              {studentPortalWeekSessions.map((session) => {
                const isDone = doneSessions.includes(session.id)

                return (
                  <div key={session.id} className="session-row">
                    <div>
                      <p className="session-time">{session.time} - {session.duration} min</p>
                      <strong>{session.focus}</strong>
                      <span>{studentPortal.student.name}</span>
                    </div>
                    <button
                      type="button"
                      className={isDone ? 'btn-secondary success' : 'btn-secondary'}
                      onClick={() => toggleSession(session.id)}
                    >
                      {isDone ? 'Concluída' : 'Marcar'}
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>

      <nav className="student-bottom-nav">
        <button
          type="button"
          className={studentTab === 'inicio' ? 'student-bottom-item active' : 'student-bottom-item'}
          onClick={() => setStudentTab('inicio')}
        >
          Início
        </button>
        <button
          type="button"
          className={
            studentTab === 'treino' || studentTab === 'historico' || studentTab === 'progresso'
              ? 'student-bottom-item active'
              : 'student-bottom-item'
          }
          onClick={() => setStudentTab('treino')}
        >
          Treino
        </button>
        <button
          type="button"
          className={studentTab === 'agenda' ? 'student-bottom-item active' : 'student-bottom-item'}
          onClick={() => setStudentTab('agenda')}
        >
          Agenda
        </button>
        <button
          type="button"
          className={studentTab === 'financeiro' ? 'student-bottom-item active' : 'student-bottom-item'}
          onClick={() => setStudentTab('financeiro')}
        >
          Financeiro
        </button>
      </nav>
    </div>
  )
}
