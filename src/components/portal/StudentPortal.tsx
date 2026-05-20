import { useState, useEffect, useMemo } from 'react'
import {
  useAuthContext,
  useBillingCoachContext,
  useMetaContext,
  useTimerPortalContext,
  useTrainerContext,
  useWorkoutContext,
} from '../../context/appContextStore'
import { RestTimer } from '../timer/RestTimer'
import { getExerciseVideoAttachment } from '../../utils/exerciseUtils'
import { normalizeWorkoutDay, normalizeWorkoutRoutine } from '../../utils/workoutProtocol'
import { readOfflineJson, writeOfflineJson } from '../../lib/offlineStore'
import type {
  ExerciseSeriesStep,
  ExerciseThumbButtonProps,
  SeriesHistoryByStudent,
  SeriesHistoryEntry,
  SeriesProgressByStudent,
  SeriesStepMeta,
  ThumbnailCache,
} from './helpers/portalTypes'
import { noThumbCacheValue } from './helpers/portalTypes'
import {
  buildEmptySeriesStepExecution,
  buildExerciseSeriesSteps,
  buildYoutubeThumbCandidates,
  extractTargetReps,
  extractWorkoutDayFromNote,
  extractWorkoutRoutineFromNote,
  formatDateKey,
  formatDateLabel,
  formatEffortHint,
  getPortalAccessState,
  normalizeSeriesHistoryStore,
  normalizeSeriesProgressStore,
  normalizeThumbnailCacheStore,
  parseNumericMetric,
  resolveExerciseThumbnailAsset,
} from './helpers/portalHelpers'

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

    let cancelled = false
    const hydrateFromIndexedDb = async () => {
      const [savedProgress, savedThumbs, savedHistory] = await Promise.all([
        readOfflineJson<SeriesProgressByStudent>(progressStorageKey),
        readOfflineJson<ThumbnailCache>(thumbnailStorageKey),
        readOfflineJson<SeriesHistoryByStudent>(progressHistoryStorageKey),
      ])

      if (cancelled) return

      if (savedProgress) {
        setSeriesProgressByStudent((current) =>
          Object.keys(current).length > 0 ? current : normalizeSeriesProgressStore(savedProgress),
        )
      }

      if (savedThumbs) {
        setThumbnailCache((current) =>
          Object.keys(current).length > 0 ? current : normalizeThumbnailCacheStore(savedThumbs),
        )
      }

      if (savedHistory) {
        setSeriesHistoryByStudent((current) =>
          Object.keys(current).length > 0 ? current : normalizeSeriesHistoryStore(savedHistory),
        )
      }
    }

    void hydrateFromIndexedDb()
    return () => {
      cancelled = true
    }
  }, [progressHistoryStorageKey, progressStorageKey, thumbnailStorageKey])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(progressStorageKey, JSON.stringify(seriesProgressByStudent))
    void writeOfflineJson(progressStorageKey, seriesProgressByStudent)
  }, [seriesProgressByStudent])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(thumbnailStorageKey, JSON.stringify(thumbnailCache))
    void writeOfflineJson(thumbnailStorageKey, thumbnailCache)
  }, [thumbnailCache])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(progressHistoryStorageKey, JSON.stringify(seriesHistoryByStudent))
    void writeOfflineJson(progressHistoryStorageKey, seriesHistoryByStudent)
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

  const [studentTab, setStudentTab] = useState<'inicio' | 'treino' | 'agenda' | 'historico' | 'progresso'>('inicio')
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
  const portalAccess = getPortalAccessState(studentPortal?.student.accessEndDate)
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
          <p>{portalAccess.badge} • {portalAccess.hint}</p>
        </div>
      </header>

      <main className="student-portal-content">
        {syncMessage && <p className="status-line">{syncMessage}</p>}

        {portalAccess.blocked && (
          <section className="panel">
            <div className="panel-head">
              <h3>Acesso bloqueado</h3>
              <p>{portalAccess.hint}</p>
            </div>
            <p className="empty-line">
              Seu treino foi bloqueado por validade expirada. Fale com seu personal para renovar seu acesso.
            </p>
          </section>
        )}

        {studentTab === 'inicio' && !portalAccess.blocked && (
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
              {hasTrainerWorkspace && (
                <button type="button" className="shortcut-card" onClick={() => setAppMode('trainer')}>
                  <strong>Painel do personal</strong>
                  <span>Voltar para gestão</span>
                </button>
              )}
            </section>
          </>
        )}

      {studentTab === 'inicio' && !portalAccess.blocked && (
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

        {studentTab === 'treino' && !portalAccess.blocked && (
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
                  const workSummary = `${protocol.workSets} séries de ${protocol.workReps} repetições (${formatEffortHint(protocol.workRpe)})`
                  const feederSummary = `${protocol.feederSets} séries de preparação com ${protocol.feederReps} repetições (${formatEffortHint(protocol.feederRpe)})`
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
                          <span>Séries principais: {workSummary}</span>
                          <p className="protocol-line">Aquecimento: {protocol.warmup} | Preparação: {feederSummary}</p>
                          {protocol.useClusterSet && (
                            <p className="protocol-line myo">
                              Cluster set: em cada série principal, faça {protocol.clusterBlocks} blocos de {protocol.clusterReps} repetições com pausa curta de {protocol.clusterRest}.
                            </p>
                          )}
                          {protocol.useMyoReps && (
                            <p className="protocol-line myo">
                              Myo-reps: após a série principal, faça {protocol.myoMiniSets} mini séries de {protocol.myoMiniReps} repetições com pausa de {protocol.myoRest}.
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
                                Pausa myo ({protocol.myoRest})
                              </button>
                            )}
                            {protocol.useClusterSet && (
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() =>
                                  applyRestTimer(
                                    protocol.clusterRest,
                                    `Cluster set ${getExerciseDisplayName(exercise.name)}`,
                                    true,
                                  )
                                }
                              >
                                Pausa cluster ({protocol.clusterRest})
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

        {studentTab === 'historico' && !portalAccess.blocked && (
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

        {studentTab === 'progresso' && !portalAccess.blocked && (
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

        {studentTab === 'agenda' && !portalAccess.blocked && (
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
          disabled={portalAccess.blocked}
        >
          Treino
        </button>
        <button
          type="button"
          className={studentTab === 'agenda' ? 'student-bottom-item active' : 'student-bottom-item'}
          onClick={() => setStudentTab('agenda')}
          disabled={portalAccess.blocked}
        >
          Agenda
        </button>
      </nav>
    </div>
  )
}
