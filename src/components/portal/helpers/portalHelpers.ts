import { inferDemoMediaType } from '../../../utils/urlUtils'
import { normalizeWorkoutDay } from '../../../utils/workoutProtocol'
import type { ExerciseVideoAttachment } from '../../../types/video'
import type { AppContextType } from '../../../context/appContextStore'
import type {
  ExerciseSeriesStep,
  ExerciseThumbAsset,
  SeriesHistoryByStudent,
  SeriesHistoryEntry,
  SeriesProgressByStudent,
  SeriesStepExecution,
  ThumbnailCache,
  YouTubeThumbQuality,
} from './portalTypes'
import { noThumbCacheValue, youtubeThumbQualities } from './portalTypes'

// ---------------------------------------------------------------------------
// Primitive helpers
// ---------------------------------------------------------------------------

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const toPositiveInt = (value: string, fallback: number): number => {
  const parsed = Number((value.match(/\d+/) || [])[0] || '')
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(Math.floor(parsed), 20)
}

export const splitWarmupBlocks = (value: string): string[] =>
  value.split(/[;,]/).map((item) => item.trim()).filter(Boolean)

export const buildEmptySeriesStepExecution = (): SeriesStepExecution => ({
  done: false, load: '', reps: '',
})

export const isThumbQuality = (value: string): value is YouTubeThumbQuality =>
  youtubeThumbQualities.includes(value as YouTubeThumbQuality)

export const formatDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export const formatDateLabel = (date: Date): string =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)

export const parseNumericMetric = (value: string): number | null => {
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '')
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return null
  return parsed
}

export const formatEffortHint = (rpe: string): string => {
  const value = rpe.trim()
  if (!value) return 'esforço confortável'
  return `esforço ${value}/10`
}

export const extractTargetReps = (step: ExerciseSeriesStep): string => {
  if (step.label.toLowerCase().includes('aquecimento')) return step.detail
  const match = step.detail.match(/(\d+)\s*(?:reps?|repeticoes|repetições)/i)
  return match?.[1] ?? step.detail
}

export const extractWorkoutDayFromNote = (note: string): string => {
  const match = note.match(/\b(?:day|dia)\s*:\s*([^|]+)/i)
  return normalizeWorkoutDay(match?.[1] ?? '')
}

export const extractWorkoutRoutineFromNote = (note: string): string => {
  const match = note.match(/\b(?:routine|rotina|treino)\s*:\s*([^|]+)/i)
  const parsed = (match?.[1] ?? '').trim().toUpperCase()
  return parsed || 'A'
}

// ---------------------------------------------------------------------------
// YouTube helpers
// ---------------------------------------------------------------------------

export const extractYoutubeVideoId = (value: string): string | null => {
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

export const buildYoutubeThumbCandidates = (videoId: string, cachedQuality?: YouTubeThumbQuality) => {
  const orderedQualities = cachedQuality
    ? [cachedQuality, ...youtubeThumbQualities.filter((q) => q !== cachedQuality)]
    : [...youtubeThumbQualities]
  return orderedQualities.map((quality) => ({ quality, url: `https://i.ytimg.com/vi/${videoId}/${quality}` }))
}

// ---------------------------------------------------------------------------
// Thumbnail asset resolution
// ---------------------------------------------------------------------------

export const resolveExerciseThumbnailAsset = (
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

// ---------------------------------------------------------------------------
// Access state
// ---------------------------------------------------------------------------

export const getPortalAccessState = (accessEndDate?: string) => {
  if (!accessEndDate) {
    return { blocked: false, badge: 'Sem validade', hint: 'Seu personal ainda não definiu uma validade para sua conta.' }
  }
  const endDate = new Date(`${accessEndDate}T23:59:59`)
  if (Number.isNaN(endDate.getTime())) {
    return { blocked: false, badge: 'Validade inválida', hint: 'Sua validade está com formato inválido. Fale com seu personal.' }
  }
  const now = new Date()
  const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) {
    return { blocked: true, badge: 'Acesso expirado', hint: `Seu acesso expirou há ${Math.abs(diffDays)} dia(s). Fale com seu personal para renovar.` }
  }
  if (diffDays === 0) {
    return { blocked: false, badge: 'Vence hoje', hint: 'Seu acesso vence hoje. Peça renovação ao personal.' }
  }
  return { blocked: false, badge: 'Acesso ativo', hint: `Seu acesso está ativo e vence em ${diffDays} dia(s).` }
}

// ---------------------------------------------------------------------------
// Store normalizers
// ---------------------------------------------------------------------------

export const normalizeThumbnailCacheStore = (value: unknown): ThumbnailCache => {
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

export const normalizeSeriesProgressStore = (value: unknown): SeriesProgressByStudent => {
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
          normalizedByStep[stepId] = { ...buildEmptySeriesStepExecution(), done: rawStep }
          return
        }
        if (!isRecord(rawStep)) { normalizedByStep[stepId] = buildEmptySeriesStepExecution(); return }
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

export const normalizeSeriesHistoryStore = (value: unknown): SeriesHistoryByStudent => {
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
      } as SeriesHistoryEntry))
      .filter((entry) => entry.exerciseKey && entry.stepId)
  })
  return normalized
}

// ---------------------------------------------------------------------------
// Exercise series builder
// ---------------------------------------------------------------------------

export const buildExerciseSeriesSteps = (
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
  const clusterBlocks = toPositiveInt(protocol.clusterBlocks, 3)
  const myoMiniSets = toPositiveInt(protocol.myoMiniSets, 3)
  const baseRest = protocol.rest.trim() || '90s'
  const clusterRest = protocol.clusterRest.trim() || '20s'
  const myoRest = protocol.myoRest.trim() || '5s'
  const keyBase = exerciseName.toLowerCase().replace(/\s+/g, '-')
  const steps: ExerciseSeriesStep[] = []

  warmupBlocks.forEach((block, index) => {
    steps.push({ id: `${keyBase}-warmup-${index + 1}`, label: `Aquecimento ${index + 1}`, detail: block, rest: baseRest })
  })

  for (let index = 1; index <= feederSets; index += 1) {
    steps.push({
      id: `${keyBase}-feeder-${index}`, label: `Preparação ${index}`,
      detail: `${protocol.feederReps} repetições (${formatEffortHint(protocol.feederRpe)})`, rest: baseRest,
    })
  }

  for (let index = 1; index <= workSets; index += 1) {
    if (protocol.useClusterSet) {
      for (let block = 1; block <= clusterBlocks; block += 1) {
        steps.push({
          id: `${keyBase}-cluster-${index}-${block}`, label: `Cluster ${index}.${block}`,
          detail: `${protocol.clusterReps} repetições (${formatEffortHint(protocol.workRpe)})`,
          rest: block === clusterBlocks ? baseRest : clusterRest,
        })
      }
      continue
    }
    steps.push({
      id: `${keyBase}-work-${index}`, label: `Série principal ${index}`,
      detail: `${protocol.workReps} repetições (${formatEffortHint(protocol.workRpe)})`, rest: baseRest,
    })
  }

  if (protocol.useMyoReps) {
    for (let index = 1; index <= myoMiniSets; index += 1) {
      steps.push({
        id: `${keyBase}-myo-${index}`, label: `Mini série ${index}`,
        detail: `${protocol.myoMiniReps} repetições`, rest: myoRest,
      })
    }
  }

  return steps
}
