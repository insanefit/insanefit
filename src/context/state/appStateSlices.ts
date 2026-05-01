import type { User } from '@supabase/supabase-js'
import { useState } from 'react'
import { defaultTrainerData, weekDays } from '../../data/mockData'
import type { CoachProfile } from '../../types/coach'
import { defaultCoachProfile } from '../../services/coachStore'
import type { StudentPortalData, TrainerData } from '../../types/trainer'
import type { ExerciseVideoAttachment, ExerciseVideoCloudStatus } from '../../types/video'
import type { WorkoutDraftItem, ProgressHistoryEntry } from '../../types/workout'
import type { LibraryExercise } from '../../data/exerciseLibrary'
import { defaultStudentForm } from '../../constants/studentOptions'
import { hasRecoveryTypeInUrl, getInitialSignupCodeFromUrl, loadLocalExerciseVideoMap } from '../../utils/exerciseUtils'
import { hasSupabaseCredentials } from '../../lib/supabase'
import { defaultBillingProfile } from '../../services/billingStore'

export const useAuthStateSlice = () => {
  const [authReady, setAuthReady] = useState(!hasSupabaseCredentials)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(() =>
    getInitialSignupCodeFromUrl() ? 'signup' : 'login',
  )
  const [authLoading, setAuthLoading] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [authForm, setAuthForm] = useState({ email: '', password: '' })
  const [authStudentCode, setAuthStudentCode] = useState(() => getInitialSignupCodeFromUrl())
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(() => hasRecoveryTypeInUrl())
  const [recoveryForm, setRecoveryForm] = useState({ password: '', confirmPassword: '' })
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  const [recoveryMessage, setRecoveryMessage] = useState(() =>
    hasRecoveryTypeInUrl() ? 'Defina sua nova senha para concluir o acesso.' : '',
  )
  const [pendingClaimCode, setPendingClaimCode] = useState('')
  const [pendingClaimLoading, setPendingClaimLoading] = useState(false)

  return {
    authReady,
    setAuthReady,
    currentUser,
    setCurrentUser,
    authMode,
    setAuthMode,
    authLoading,
    setAuthLoading,
    authMessage,
    setAuthMessage,
    authForm,
    setAuthForm,
    authStudentCode,
    setAuthStudentCode,
    passwordRecoveryMode,
    setPasswordRecoveryMode,
    recoveryForm,
    setRecoveryForm,
    recoveryLoading,
    setRecoveryLoading,
    recoveryMessage,
    setRecoveryMessage,
    pendingClaimCode,
    setPendingClaimCode,
    pendingClaimLoading,
    setPendingClaimLoading,
  }
}

export const useTrainerStateSlice = () => {
  const [trainerData, setTrainerData] = useState<TrainerData>(defaultTrainerData)
  const [selectedStudentId, setSelectedStudentId] = useState(defaultTrainerData.students[0]?.id ?? '')
  const [selectedDay, setSelectedDay] = useState(weekDays[0])
  const [doneSessions, setDoneSessions] = useState<string[]>([])
  const [progressHistory, setProgressHistory] = useState<Record<string, ProgressHistoryEntry[]>>({})
  const [loading, setLoading] = useState(true)
  const [syncMessage, setSyncMessage] = useState('')

  return {
    trainerData,
    setTrainerData,
    selectedStudentId,
    setSelectedStudentId,
    selectedDay,
    setSelectedDay,
    doneSessions,
    setDoneSessions,
    progressHistory,
    setProgressHistory,
    loading,
    setLoading,
    syncMessage,
    setSyncMessage,
  }
}

export const usePortalStateSlice = () => {
  const [appMode, setAppMode] = useState<'trainer' | 'student'>('trainer')
  const [studentPortal, setStudentPortal] = useState<StudentPortalData | null>(null)
  const [studentAccessCode, setStudentAccessCode] = useState('')
  const [linkingStudent, setLinkingStudent] = useState(false)

  return {
    appMode,
    setAppMode,
    studentPortal,
    setStudentPortal,
    studentAccessCode,
    setStudentAccessCode,
    linkingStudent,
    setLinkingStudent,
  }
}

export const useBillingStateSlice = () => {
  const [billingProfile, setBillingProfile] = useState(defaultBillingProfile)
  const [billingLoading, setBillingLoading] = useState(false)

  return { billingProfile, setBillingProfile, billingLoading, setBillingLoading }
}

export const useStudentsCrudStateSlice = () => {
  const [studentForm, setStudentForm] = useState(defaultStudentForm)
  const [editingStudent, setEditingStudent] = useState(false)
  const [studentEditForm, setStudentEditForm] = useState(defaultStudentForm)

  return {
    studentForm,
    setStudentForm,
    editingStudent,
    setEditingStudent,
    studentEditForm,
    setStudentEditForm,
  }
}

export const useSessionStateSlice = () => {
  const [sessionForm, setSessionForm] = useState({
    studentId: defaultTrainerData.students[0]?.id ?? '',
    day: weekDays[0],
    time: '07:00',
    focus: '',
    duration: 60,
  })
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  return { sessionForm, setSessionForm, editingSessionId, setEditingSessionId }
}

export const useNavigationStateSlice = () => {
  const [activeMenu, setActiveMenu] = useState('Dashboard')
  return { activeMenu, setActiveMenu }
}

export const useExerciseFiltersStateSlice = () => {
  const [exerciseQuery, setExerciseQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState('Todos')
  const [categoryFilter, setCategoryFilter] = useState('Todas')
  const [equipmentFilter, setEquipmentFilter] = useState('Todos')
  const [difficultyFilter, setDifficultyFilter] = useState<
    'Todos' | 'beginner' | 'intermediate' | 'advanced'
  >('Todos')
  const [sourceFilter, setSourceFilter] = useState<'Todos' | 'core' | 'animatic'>('Todos')

  return {
    exerciseQuery,
    setExerciseQuery,
    groupFilter,
    setGroupFilter,
    categoryFilter,
    setCategoryFilter,
    equipmentFilter,
    setEquipmentFilter,
    difficultyFilter,
    setDifficultyFilter,
    sourceFilter,
    setSourceFilter,
  }
}

export const useDemoStateSlice = () => {
  const [demoExercise, setDemoExercise] = useState<LibraryExercise | null>(null)
  const [demoModelIndex, setDemoModelIndex] = useState(0)
  const [studentVideoExerciseName, setStudentVideoExerciseName] = useState('')
  const [studentDemoModelIndex, setStudentDemoModelIndex] = useState(0)

  return {
    demoExercise,
    setDemoExercise,
    demoModelIndex,
    setDemoModelIndex,
    studentVideoExerciseName,
    setStudentVideoExerciseName,
    studentDemoModelIndex,
    setStudentDemoModelIndex,
  }
}

export const useExerciseVideosStateSlice = () => {
  const [exerciseVideoMap, setExerciseVideoMap] = useState<Record<string, ExerciseVideoAttachment>>(
    () => loadLocalExerciseVideoMap(),
  )
  const [exerciseVideoCloudStatus, setExerciseVideoCloudStatus] = useState<ExerciseVideoCloudStatus>('idle')
  const [videoAttachmentForm, setVideoAttachmentForm] = useState({
    rawUrl: '',
    licenseLabel: '',
    notes: '',
  })
  const [batchVideoInput, setBatchVideoInput] = useState('')
  const [batchVideoSaving, setBatchVideoSaving] = useState(false)
  const [rapidApiImporting, setRapidApiImporting] = useState(false)

  return {
    exerciseVideoMap,
    setExerciseVideoMap,
    exerciseVideoCloudStatus,
    setExerciseVideoCloudStatus,
    videoAttachmentForm,
    setVideoAttachmentForm,
    batchVideoInput,
    setBatchVideoInput,
    batchVideoSaving,
    setBatchVideoSaving,
    rapidApiImporting,
    setRapidApiImporting,
  }
}

export const useWorkoutBuilderStateSlice = () => {
  const [workoutDraft, setWorkoutDraft] = useState<WorkoutDraftItem[]>([])
  const [editingDraftExerciseId, setEditingDraftExerciseId] = useState<string | null>(null)
  const [quickAddExerciseName, setQuickAddExerciseName] = useState('')
  const [manualExerciseForm, setManualExerciseForm] = useState({
    name: '',
    muscleGroup: 'Funcional',
    category: 'Personalizado',
    equipment: 'Livre',
  })
  const [workoutBuilderOpen, setWorkoutBuilderOpen] = useState(false)
  const [workoutBuilderStep, setWorkoutBuilderStep] = useState<'biblioteca' | 'protocolo'>('biblioteca')
  const [workoutBuilderMode, setWorkoutBuilderMode] = useState<'simplificado' | 'pro'>('simplificado')
  const [quickProtocolForm, setQuickProtocolForm] = useState({
    workSets: '3',
    workReps: '8-12',
    workRpe: '8',
    rest: '75s',
  })

  return {
    workoutDraft,
    setWorkoutDraft,
    editingDraftExerciseId,
    setEditingDraftExerciseId,
    quickAddExerciseName,
    setQuickAddExerciseName,
    manualExerciseForm,
    setManualExerciseForm,
    workoutBuilderOpen,
    setWorkoutBuilderOpen,
    workoutBuilderStep,
    setWorkoutBuilderStep,
    workoutBuilderMode,
    setWorkoutBuilderMode,
    quickProtocolForm,
    setQuickProtocolForm,
  }
}

export const useCoachStateSlice = () => {
  const [coachProfile, setCoachProfile] = useState<CoachProfile>(defaultCoachProfile)
  const [coachForm, setCoachForm] = useState<CoachProfile>(defaultCoachProfile)

  return { coachProfile, setCoachProfile, coachForm, setCoachForm }
}

export const useTimerStateSlice = () => {
  const [restTimerTotalSeconds, setRestTimerTotalSeconds] = useState(60)
  const [restTimerRemainingSeconds, setRestTimerRemainingSeconds] = useState(60)
  const [restTimerRunning, setRestTimerRunning] = useState(false)
  const [restTimerInput, setRestTimerInput] = useState('60s')
  const [restTimerSource, setRestTimerSource] = useState('Descanso livre')
  const [restTimerDone, setRestTimerDone] = useState(false)

  return {
    restTimerTotalSeconds,
    setRestTimerTotalSeconds,
    restTimerRemainingSeconds,
    setRestTimerRemainingSeconds,
    restTimerRunning,
    setRestTimerRunning,
    restTimerInput,
    setRestTimerInput,
    restTimerSource,
    setRestTimerSource,
    restTimerDone,
    setRestTimerDone,
  }
}
