import { useMemo } from 'react'
import { getPlanDefinition } from '../../data/plans'
import type { BillingProfile } from '../../types/billing'
import type { CoachProfile } from '../../types/coach'
import type { StudentPortalData, TrainerData } from '../../types/trainer'
import type { ExerciseVideoAttachment, DemoViewerOption } from '../../types/video'
import type { ProgressHistoryEntry, WorkoutDraftItem } from '../../types/workout'
import type { LibraryExercise } from '../../data/exerciseLibrary'
import {
  findLibraryExerciseByName,
  getExerciseDisplayName,
  getExerciseVideoAttachment,
  normalizeExerciseKey,
} from '../../utils/exerciseUtils'
import { buildDemoOptionsForExercise } from '../../utils/urlUtils'

type TrainerDerivedParams = {
  trainerData: TrainerData
  selectedStudentId: string
  selectedDay: string
  progressHistory: Record<string, ProgressHistoryEntry[]>
  doneSessions: string[]
}

export const useTrainerDerivedState = ({
  trainerData,
  selectedStudentId,
  selectedDay,
  progressHistory,
  doneSessions,
}: TrainerDerivedParams) => {
  const students = trainerData.students
  const sessions = trainerData.sessions

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) ?? null,
    [selectedStudentId, students],
  )

  const selectedStudentHistory = useMemo(
    () => (selectedStudent ? progressHistory[selectedStudent.id] ?? [] : []),
    [progressHistory, selectedStudent],
  )

  const weekSessions = useMemo(
    () => sessions.filter((session) => session.day === selectedDay),
    [selectedDay, sessions],
  )

  const completionRate = sessions.length ? Math.round((doneSessions.length / sessions.length) * 100) : 0
  const hasTrainerWorkspace = students.length > 0 || sessions.length > 0
  const selectedStudentWorkoutCount = selectedStudent
    ? (trainerData.workoutByStudent[selectedStudent.id] ?? []).length
    : 0
  const selectedStudentHistoryPreview = selectedStudentHistory.slice(-7)

  return {
    students,
    sessions,
    selectedStudent,
    selectedStudentHistory,
    weekSessions,
    completionRate,
    hasTrainerWorkspace,
    selectedStudentWorkoutCount,
    selectedStudentHistoryPreview,
  }
}

type ExerciseLibraryDerivedParams = {
  mergedExerciseLibrary: LibraryExercise[]
  exerciseQuery: string
  groupFilter: string
  categoryFilter: string
  equipmentFilter: string
  difficultyFilter: 'Todos' | 'beginner' | 'intermediate' | 'advanced'
  sourceFilter: 'Todos' | 'core' | 'animatic'
  workoutDraft: WorkoutDraftItem[]
}

export const useExerciseLibraryDerivedState = ({
  mergedExerciseLibrary,
  exerciseQuery,
  groupFilter,
  categoryFilter,
  equipmentFilter,
  difficultyFilter,
  sourceFilter,
  workoutDraft,
}: ExerciseLibraryDerivedParams) => {
  const categoryOptions = useMemo(
    () => [
      'Todas',
      ...Array.from(new Set(mergedExerciseLibrary.map((exercise) => exercise.category))).sort((left, right) =>
        left.localeCompare(right),
      ),
    ],
    [mergedExerciseLibrary],
  )

  const equipmentOptions = useMemo(
    () => [
      'Todos',
      ...Array.from(new Set(mergedExerciseLibrary.map((exercise) => exercise.equipment))).sort((left, right) =>
        left.localeCompare(right),
      ),
    ],
    [mergedExerciseLibrary],
  )

  const sourceSummary = useMemo(
    () => ({
      core: mergedExerciseLibrary.filter((exercise) => (exercise.source ?? 'core') === 'core').length,
      animatic: mergedExerciseLibrary.filter((exercise) => exercise.source === 'animatic').length,
    }),
    [mergedExerciseLibrary],
  )

  const filteredExercises = useMemo(() => {
    const query = exerciseQuery.trim().toLowerCase()

    return mergedExerciseLibrary.filter((exercise) => {
      const matchesGroup = groupFilter === 'Todos' || exercise.muscleGroup === groupFilter
      const matchesCategory = categoryFilter === 'Todas' || exercise.category === categoryFilter
      const matchesEquipment = equipmentFilter === 'Todos' || exercise.equipment === equipmentFilter
      const matchesDifficulty = difficultyFilter === 'Todos' || exercise.difficulty === difficultyFilter
      const matchesSource = sourceFilter === 'Todos' || (exercise.source ?? 'core') === sourceFilter
      if (!matchesGroup || !matchesCategory || !matchesEquipment || !matchesDifficulty || !matchesSource) return false
      if (!query) return true

      const displayName = getExerciseDisplayName(exercise.name).toLowerCase()
      return (
        exercise.name.toLowerCase().includes(query) ||
        displayName.includes(query) ||
        exercise.equipment.toLowerCase().includes(query) ||
        exercise.category.toLowerCase().includes(query)
      )
    })
  }, [categoryFilter, difficultyFilter, equipmentFilter, exerciseQuery, groupFilter, mergedExerciseLibrary, sourceFilter])

  const quickAddExercises = useMemo(() => {
    const draftNames = new Set(workoutDraft.map((item) => item.name.toLowerCase()))
    const base = exerciseQuery.trim() ? filteredExercises : mergedExerciseLibrary
    return base.filter((exercise) => !draftNames.has(exercise.name.toLowerCase())).slice(0, 10)
  }, [exerciseQuery, filteredExercises, mergedExerciseLibrary, workoutDraft])

  return { categoryOptions, equipmentOptions, sourceSummary, filteredExercises, quickAddExercises }
}

type DemoDerivedParams = {
  demoExercise: LibraryExercise | null
  exerciseVideoMap: Record<string, ExerciseVideoAttachment>
  demoModelIndex: number
  studentPortal: StudentPortalData | null
  studentVideoExerciseName: string
  studentDemoModelIndex: number
  selectedDay: string
  doneSessions: string[]
}

export const useExerciseDemoDerivedState = ({
  demoExercise,
  exerciseVideoMap,
  demoModelIndex,
  studentPortal,
  studentVideoExerciseName,
  studentDemoModelIndex,
  selectedDay,
  doneSessions,
}: DemoDerivedParams) => {
  const demoOptions = useMemo<DemoViewerOption[]>(() => {
    if (!demoExercise) return []
    const attachment = getExerciseVideoAttachment(demoExercise.name, exerciseVideoMap)
    return buildDemoOptionsForExercise(demoExercise.name, demoExercise.muscleGroup, attachment)
  }, [demoExercise, exerciseVideoMap])

  const activeDemoOption = demoOptions[Math.min(demoModelIndex, Math.max(demoOptions.length - 1, 0))]
  const activeStudentVideoExerciseName = studentVideoExerciseName || studentPortal?.workout[0]?.name || ''

  const studentPortalWeekSessions = useMemo(
    () => (studentPortal ? studentPortal.sessions.filter((session) => session.day === selectedDay) : []),
    [studentPortal, selectedDay],
  )

  const studentPortalCompletionRate =
    studentPortal && studentPortal.sessions.length > 0
      ? Math.round(
          (doneSessions.filter((id) => studentPortal.sessions.some((session) => session.id === id)).length /
            studentPortal.sessions.length) *
            100,
        )
      : 0

  const studentDemoContext = useMemo(() => {
    if (!studentPortal || !activeStudentVideoExerciseName) return null

    const targetExercise =
      studentPortal.workout.find((exercise) => exercise.name === activeStudentVideoExerciseName) ??
      studentPortal.workout.find(
        (exercise) => normalizeExerciseKey(exercise.name) === normalizeExerciseKey(activeStudentVideoExerciseName),
      )

    const effectiveExercise = targetExercise ?? studentPortal.workout[0]
    if (!effectiveExercise) return null

    const source = findLibraryExerciseByName(effectiveExercise.name)
    const attachment = getExerciseVideoAttachment(effectiveExercise.name, exerciseVideoMap)
    const options = buildDemoOptionsForExercise(effectiveExercise.name, source?.muscleGroup, attachment)
    const activeOption = options[Math.min(studentDemoModelIndex, Math.max(options.length - 1, 0))]

    return { exerciseName: effectiveExercise.name, options, activeOption }
  }, [activeStudentVideoExerciseName, exerciseVideoMap, studentDemoModelIndex, studentPortal])

  return {
    demoOptions,
    activeDemoOption,
    activeStudentVideoExerciseName,
    studentPortalWeekSessions,
    studentPortalCompletionRate,
    studentDemoContext,
  }
}

type MetaDerivedParams = {
  billingProfile: BillingProfile
  studentsCount: number
  coachProfile: CoachProfile
  coachForm: CoachProfile
  restTimerTotalSeconds: number
  restTimerRemainingSeconds: number
  workoutDraft: WorkoutDraftItem[]
}

export const useMetaDerivedState = ({
  billingProfile,
  studentsCount,
  coachProfile,
  coachForm,
  restTimerTotalSeconds,
  restTimerRemainingSeconds,
  workoutDraft,
}: MetaDerivedParams) => {
  const activePlan = useMemo(() => getPlanDefinition(billingProfile.plan), [billingProfile.plan])
  const studentCapacityText =
    activePlan.studentLimit === null
      ? `${studentsCount} alunos ativos`
      : `${studentsCount}/${activePlan.studentLimit} alunos`

  const coachInitial = (coachProfile.displayName.trim().charAt(0) || 'C').toUpperCase()
  const coachFormInitial = (coachForm.displayName.trim().charAt(0) || 'C').toUpperCase()
  const restTimerProgress = restTimerTotalSeconds
    ? Math.round((restTimerRemainingSeconds / restTimerTotalSeconds) * 100)
    : 0

  const workoutDraftGroups = useMemo(() => {
    const groups = workoutDraft.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.muscleGroup] = (accumulator[item.muscleGroup] ?? 0) + 1
      return accumulator
    }, {})
    return Object.entries(groups)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
  }, [workoutDraft])

  return {
    activePlan,
    studentCapacityText,
    coachInitial,
    coachFormInitial,
    restTimerProgress,
    workoutDraftGroups,
  }
}
