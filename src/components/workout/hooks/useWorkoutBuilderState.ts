import { useMemo, useState } from 'react'
import type { Dispatch, FormEvent, SetStateAction } from 'react'
import { getExerciseVideoAttachment } from '../../../utils/exerciseUtils'
import {
  formatWorkoutRoutineName,
  normalizeWorkoutDay,
  normalizeWorkoutRoutine,
  normalizeWorkoutRoutineLabel,
} from '../../../utils/workoutProtocol'
import type { WorkoutDraftItem} from '../../../types/workout'
import type { LibraryExercise } from '../../../data/exerciseLibrary'

const extractYoutubeVideoId = (value: string): string | null => {
  const raw = value.trim()
  if (!raw) return null
  const embedMatch = raw.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/)
  if (embedMatch?.[1]) return embedMatch[1]
  const watchMatch = raw.match(/[?&]v=([a-zA-Z0-9_-]{6,})/)
  if (watchMatch?.[1]) return watchMatch[1]
  const shortMatch = raw.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/)
  if (shortMatch?.[1]) return shortMatch[1]
  return null
}

const buildYoutubeThumbUrl = (videoId: string): string => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

export type ProtocolMode = 'padrao' | 'cluster' | 'myo' | 'cluster_myo'

type VideoAttachmentFormState = {
  rawUrl: string
  licenseLabel: string
  notes: string
}

export type WorkoutBuilderLocalState = {
  libraryTab: 'app' | 'withGif' | 'inDraft'
  setLibraryTab: (tab: 'app' | 'withGif' | 'inDraft') => void
  libraryPage: number
  setLibraryPage: (page: number | ((current: number) => number)) => void
  showAdvancedLibraryTools: boolean
  setShowAdvancedLibraryTools: (value: boolean | ((current: boolean) => boolean)) => void
  showManualCreateForm: boolean
  setShowManualCreateForm: (value: boolean | ((current: boolean) => boolean)) => void
  showPlanningTools: boolean
  setShowPlanningTools: (value: boolean | ((current: boolean) => boolean)) => void
  collapsedDraftExerciseIds: string[]
  setCollapsedDraftExerciseIds: (value: string[] | ((current: string[]) => string[])) => void
  finalizeLoading: boolean
  activeDraftDay: string
  setActiveDraftDayChoice: (value: string) => void
  draftDayFilter: 'Todos' | string
  setDraftDayFilterChoice: (value: 'Todos' | string) => void
  activeDraftRoutine: string
  setActiveDraftRoutineChoice: (value: string) => void
  draftRoutineFilter: 'Todos' | string
  setDraftRoutineFilterChoice: (value: 'Todos' | string) => void
  duplicateSourceRoutine: string
  setDuplicateSourceRoutine: (value: string) => void
  duplicateTargetRoutine: string
  setDuplicateTargetRoutine: (value: string) => void
  studentAvailableDays: string[]
  studentRoutineOptions: string[]
  activeDraftRoutineLabel: string
  getRoutineDisplayName: (routine: string) => string
  handleUpdateRoutineLabel: (value: string) => void
  draftNameKeys: Set<string>
  libraryExercises: LibraryExercise[]
  videoEnabledCount: number
  draftMatchCount: number
  filteredDraft: WorkoutDraftItem[]
  totalLibraryPages: number
  safeLibraryPage: number
  visibleLibraryExercises: LibraryExercise[]
  visiblePages: number[]
  handleDuplicateRoutine: () => void
  handleClearLibraryFilters: () => void
  handleOpenManualCreate: () => void
  runFinalizeWorkout: (advanceToNextDay: boolean) => Promise<void>
  handleSubmitManualCreate: (event: FormEvent<HTMLFormElement>) => void
  isExerciseCollapsed: (exerciseId: string) => boolean
  handleEditExerciseVideo: (exercise: LibraryExercise) => void
  getProtocolMode: (exercise: WorkoutDraftItem) => ProtocolMode
  applyProtocolMode: (exerciseId: string, mode: ProtocolMode) => void
  extractYoutubeVideoId: typeof extractYoutubeVideoId
  buildYoutubeThumbUrl: typeof buildYoutubeThumbUrl
}

export function useWorkoutBuilderState(context: {
  selectedStudent: { id: string; name: string } | null
  sessions: Array<{ studentId: string; day: string }>
  weekDays: string[]
  workoutDraft: WorkoutDraftItem[]
  setWorkoutDraft: (value: WorkoutDraftItem[] | ((current: WorkoutDraftItem[]) => WorkoutDraftItem[])) => void
  filteredExercises: LibraryExercise[]
  exerciseVideoMap: Record<string, unknown>
  setSyncMessage: (value: string | ((current: string) => string)) => void
  setWorkoutBuilderStep: (step: 'biblioteca' | 'protocolo') => void
  setVideoAttachmentForm: Dispatch<SetStateAction<VideoAttachmentFormState>>
  handleOpenExerciseDemo: (exercise: LibraryExercise) => void
  handleSaveWorkoutDraft: () => Promise<void>
  handleAddManualExercise: (event: FormEvent<HTMLFormElement>, day?: string, routine?: string, routineLabel?: string) => void
  manualExerciseForm: { name: string }
  editingDraftExerciseId: string | null
  setEditingDraftExerciseId: (value: string | null | ((current: string | null) => string | null)) => void
}): WorkoutBuilderLocalState {
  const {
    selectedStudent, sessions, weekDays, workoutDraft, setWorkoutDraft,
    filteredExercises, exerciseVideoMap, setSyncMessage, setWorkoutBuilderStep,
    setVideoAttachmentForm, handleOpenExerciseDemo, handleSaveWorkoutDraft,
    handleAddManualExercise, manualExerciseForm  } = context

  const [libraryTab, setLibraryTab] = useState<'app' | 'withGif' | 'inDraft'>('app')
  const [libraryPage, setLibraryPage] = useState(1)
  const [showAdvancedLibraryTools, setShowAdvancedLibraryTools] = useState(false)
  const [showManualCreateForm, setShowManualCreateForm] = useState(false)
  const [showPlanningTools, setShowPlanningTools] = useState(false)
  const [collapsedDraftExerciseIds, setCollapsedDraftExerciseIds] = useState<string[]>([])
  const [finalizeLoading, setFinalizeLoading] = useState(false)
  const [activeDraftDayChoice, setActiveDraftDayChoice] = useState('')
  const [draftDayFilterChoice, setDraftDayFilterChoice] = useState<'Todos' | string>('Todos')
  const [activeDraftRoutineChoice, setActiveDraftRoutineChoice] = useState('A')
  const [draftRoutineFilterChoice, setDraftRoutineFilterChoice] = useState<'Todos' | string>('Todos')
  const [duplicateSourceRoutine, setDuplicateSourceRoutine] = useState('A')
  const [duplicateTargetRoutine, setDuplicateTargetRoutine] = useState('B')
  const [routineLabelOverrides, setRoutineLabelOverrides] = useState<Record<string, string>>({})
  const libraryPageSize = 10

  const studentAvailableDays = useMemo(() => {
    if (!selectedStudent) return weekDays
    const days = Array.from(
      new Set(
        sessions
          .filter((session) => session.studentId === selectedStudent.id)
          .map((session) => normalizeWorkoutDay(session.day))
          .filter(Boolean),
      ),
    )
    return days.length > 0 ? days : weekDays
  }, [selectedStudent, sessions, weekDays])

  const activeDraftDay = studentAvailableDays.find((day) => day === activeDraftDayChoice) ?? studentAvailableDays[0] ?? ''

  const studentRoutineOptions = useMemo(() => {
    const existing = Array.from(new Set(workoutDraft.map((item) => normalizeWorkoutRoutine(item.routine)).filter(Boolean)))
    const defaults = ['A', 'B', 'C', 'D']
    return Array.from(new Set([...defaults, ...existing]))
  }, [workoutDraft])

  const activeDraftRoutine = studentRoutineOptions.find((r) => r === normalizeWorkoutRoutine(activeDraftRoutineChoice)) ?? 'A'

  const routineLabelMap = useMemo(() => {
    const draftLabels = workoutDraft.reduce<Record<string, string>>((acc, item) => {
      const key = normalizeWorkoutRoutine(item.routine)
      const label = normalizeWorkoutRoutineLabel(item.routineLabel ?? '')
      if (key && label && !acc[key]) acc[key] = label
      return acc
    }, {})

    return { ...draftLabels, ...routineLabelOverrides }
  }, [routineLabelOverrides, workoutDraft])

  const activeDraftRoutineLabel = routineLabelMap[activeDraftRoutine] ?? ''

  const getRoutineDisplayName = (routine: string): string => {
    const key = normalizeWorkoutRoutine(routine)
    return formatWorkoutRoutineName(key, routineLabelMap[key])
  }

  const handleUpdateRoutineLabel = (value: string) => {
    const label = normalizeWorkoutRoutineLabel(value)
    const routine = activeDraftRoutine

    setRoutineLabelOverrides((current) => ({
      ...current,
      [routine]: label,
    }))

    setWorkoutDraft((current) =>
      current.map((item) =>
        normalizeWorkoutRoutine(item.routine) === routine ? { ...item, routineLabel: label } : item,
      ),
    )
  }

  const draftDayFilter = draftDayFilterChoice === 'Todos' || studentAvailableDays.some((d) => d === draftDayFilterChoice) ? draftDayFilterChoice : 'Todos'

  const draftRoutineFilter = draftRoutineFilterChoice === 'Todos' || studentRoutineOptions.some((r) => r === normalizeWorkoutRoutine(draftRoutineFilterChoice))
    ? draftRoutineFilterChoice === 'Todos' ? 'Todos' : normalizeWorkoutRoutine(draftRoutineFilterChoice)
    : 'Todos'

  const draftNameKeys = useMemo(() => new Set(workoutDraft.map((item) => item.name.trim().toLowerCase())), [workoutDraft])

  const libraryExercises = useMemo(() => {
    if (libraryTab === 'withGif') return filteredExercises.filter((e) => Boolean(getExerciseVideoAttachment(e.name, exerciseVideoMap as Record<string, import('../../../types/video').ExerciseVideoAttachment>)))
    if (libraryTab === 'inDraft') return filteredExercises.filter((e) => draftNameKeys.has(e.name.trim().toLowerCase()))
    return filteredExercises
  }, [draftNameKeys, exerciseVideoMap, filteredExercises, libraryTab])

  const videoEnabledCount = useMemo(() => filteredExercises.filter((e) => Boolean(getExerciseVideoAttachment(e.name, exerciseVideoMap as Record<string, import('../../../types/video').ExerciseVideoAttachment>))).length, [exerciseVideoMap, filteredExercises])
  const draftMatchCount = useMemo(() => filteredExercises.filter((e) => draftNameKeys.has(e.name.trim().toLowerCase())).length, [draftNameKeys, filteredExercises])

  const filteredDraft = useMemo(() =>
    workoutDraft.filter((item) => {
      const byDay = draftDayFilter === 'Todos' || normalizeWorkoutDay(item.day) === draftDayFilter
      const byRoutine = draftRoutineFilter === 'Todos' || normalizeWorkoutRoutine(item.routine) === draftRoutineFilter
      return byDay && byRoutine
    }),
  [draftDayFilter, draftRoutineFilter, workoutDraft])

  const totalLibraryPages = Math.max(1, Math.ceil(libraryExercises.length / libraryPageSize))
  const safeLibraryPage = Math.min(libraryPage, totalLibraryPages)
  const visibleLibraryExercises = libraryExercises.slice((safeLibraryPage - 1) * libraryPageSize, safeLibraryPage * libraryPageSize)

  const visiblePages = useMemo(() => {
    if (totalLibraryPages <= 7) return Array.from({ length: totalLibraryPages }, (_, i) => i + 1)
    const start = Math.max(1, Math.min(safeLibraryPage - 2, totalLibraryPages - 6))
    return Array.from({ length: 7 }, (_, i) => start + i)
  }, [safeLibraryPage, totalLibraryPages])

  const handleDuplicateRoutine = () => {
    const sourceRoutine = normalizeWorkoutRoutine(duplicateSourceRoutine)
    const targetRoutine = normalizeWorkoutRoutine(duplicateTargetRoutine)
    if (sourceRoutine === targetRoutine) { setSyncMessage('Escolha treinos diferentes para duplicar.'); return }
    const sourceItems = workoutDraft.filter((item) => normalizeWorkoutRoutine(item.routine) === sourceRoutine)
    if (sourceItems.length === 0) { setSyncMessage(`Nao existe treino ${sourceRoutine} para duplicar.`); return }
    const now = Date.now()
    setWorkoutDraft((current) => {
      const withoutTarget = current.filter((item) => normalizeWorkoutRoutine(item.routine) !== targetRoutine)
      const targetRoutineLabel = routineLabelMap[targetRoutine] ?? ''
      const duplicatedItems = sourceItems.map((item, index) => ({
        ...item,
        id: `${item.id}-dup-${targetRoutine}-${now}-${index}`,
        routine: targetRoutine,
        routineLabel: targetRoutineLabel,
      }))
      return [...withoutTarget, ...duplicatedItems]
    })
    setActiveDraftRoutineChoice(targetRoutine)
    setDraftRoutineFilterChoice(targetRoutine)
    setSyncMessage(`Treino ${sourceRoutine} duplicado para treino ${targetRoutine}.`)
  }

  const handleClearLibraryFilters = () => {
    setLibraryPage(1); setLibraryTab('app')
  }

  const handleOpenManualCreate = () => { setWorkoutBuilderStep('protocolo'); setShowManualCreateForm(true) }

  const getNextDraftDay = () => {
    if (studentAvailableDays.length === 0) return ''
    const currentIndex = studentAvailableDays.findIndex((d) => d === activeDraftDay)
    if (currentIndex < 0) return studentAvailableDays[0] ?? ''
    const nextIndex = (currentIndex + 1) % studentAvailableDays.length
    return studentAvailableDays[nextIndex] ?? studentAvailableDays[0] ?? ''
  }

  const runFinalizeWorkout = async (advanceToNextDay: boolean) => {
    if (finalizeLoading) return
    setFinalizeLoading(true)
    try {
      await handleSaveWorkoutDraft()
      if (advanceToNextDay) {
        const nextDay = getNextDraftDay()
        if (nextDay) { setActiveDraftDayChoice(nextDay); setDraftDayFilterChoice(nextDay) }
        setWorkoutBuilderStep('biblioteca')
      }
    } finally {
      setFinalizeLoading(false)
    }
  }

  const handleSubmitManualCreate = (event: FormEvent<HTMLFormElement>) => {
    const hasName = manualExerciseForm.name.trim().length > 0
    handleAddManualExercise(event, activeDraftDay, activeDraftRoutine, activeDraftRoutineLabel)
    if (hasName) setShowManualCreateForm(false)
  }

  const isExerciseCollapsed = (exerciseId: string) => collapsedDraftExerciseIds.includes(exerciseId)

  const handleEditExerciseVideo = (exercise: LibraryExercise) => {
    const attachment = getExerciseVideoAttachment(exercise.name, exerciseVideoMap as Record<string, import('../../../types/video').ExerciseVideoAttachment>)
    setVideoAttachmentForm({ rawUrl: attachment?.rawUrl ?? '', licenseLabel: attachment?.licenseLabel ?? '', notes: attachment?.notes ?? '' })
    handleOpenExerciseDemo(exercise)
  }

  const getProtocolMode = (exercise: WorkoutDraftItem): ProtocolMode => {
    if (exercise.useClusterSet && exercise.useMyoReps) return 'cluster_myo'
    if (exercise.useClusterSet) return 'cluster'
    if (exercise.useMyoReps) return 'myo'
    return 'padrao'
  }

  const applyProtocolMode = (exerciseId: string, mode: ProtocolMode) => {
    setWorkoutDraft((current) =>
      current.map((item) => {
        if (item.id !== exerciseId) return item
        if (mode === 'padrao') return { ...item, useClusterSet: false, useMyoReps: false }
        if (mode === 'cluster') return { ...item, useClusterSet: true, clusterBlocks: item.clusterBlocks.trim() || '3', clusterReps: item.clusterReps.trim() || '2-3', clusterRest: item.clusterRest.trim() || '20s', useMyoReps: false }
        if (mode === 'myo') return { ...item, useClusterSet: false, useMyoReps: true, myoMiniSets: item.myoMiniSets.trim() || '3', myoMiniReps: item.myoMiniReps.trim() || '3-5', myoRest: item.myoRest.trim() || '5s' }
        return { ...item, useClusterSet: true, clusterBlocks: item.clusterBlocks.trim() || '3', clusterReps: item.clusterReps.trim() || '2-3', clusterRest: item.clusterRest.trim() || '20s', useMyoReps: true, myoMiniSets: item.myoMiniSets.trim() || '3', myoMiniReps: item.myoMiniReps.trim() || '3-5', myoRest: item.myoRest.trim() || '5s' }
      }),
    )
  }

  return {
    libraryTab, setLibraryTab,
    libraryPage, setLibraryPage,
    showAdvancedLibraryTools, setShowAdvancedLibraryTools,
    showManualCreateForm, setShowManualCreateForm,
    showPlanningTools, setShowPlanningTools,
    collapsedDraftExerciseIds, setCollapsedDraftExerciseIds,
    finalizeLoading,
    activeDraftDay, setActiveDraftDayChoice,
    draftDayFilter, setDraftDayFilterChoice,
    activeDraftRoutine, setActiveDraftRoutineChoice,
    draftRoutineFilter, setDraftRoutineFilterChoice,
    duplicateSourceRoutine, setDuplicateSourceRoutine,
    duplicateTargetRoutine, setDuplicateTargetRoutine,
    studentAvailableDays, studentRoutineOptions,
    activeDraftRoutineLabel, getRoutineDisplayName, handleUpdateRoutineLabel,
    draftNameKeys, libraryExercises, videoEnabledCount, draftMatchCount, filteredDraft,
    totalLibraryPages, safeLibraryPage, visibleLibraryExercises, visiblePages,
    handleDuplicateRoutine, handleClearLibraryFilters, handleOpenManualCreate,
    runFinalizeWorkout, handleSubmitManualCreate, isExerciseCollapsed,
    handleEditExerciseVideo, getProtocolMode, applyProtocolMode,
    extractYoutubeVideoId, buildYoutubeThumbUrl,
  }
}
