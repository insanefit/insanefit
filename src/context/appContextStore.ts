import { createContext, useContext } from 'react'
import type {
  ChangeEvent,
  Dispatch,
  FormEvent,
  ReactNode,
  SetStateAction,
} from 'react'
import type { User } from '@supabase/supabase-js'
import type { PlanDefinition, PlanId, BillingProfile } from '../types/billing'
import type { CoachProfile } from '../types/coach'
import type { Exercise, Session, Student, StudentPortalData, TrainerData } from '../types/trainer'
import type { ExerciseVideoAttachment, ExerciseVideoCloudStatus, DemoViewerOption } from '../types/video'
import type { ProgressHistoryEntry, WorkoutDraftEditableField, WorkoutDraftItem } from '../types/workout'
import type { LibraryExercise } from '../data/exerciseLibrary'
import type { WorkoutTemplate } from '../constants/workoutTemplates'
import type { NavItem } from '../utils/exerciseUtils'

export type StudentFormState = {
  name: string
  sex: string
  trainingLevel: string
  workoutType: string
  whatsapp: string
  monthlyFee: string
  dueDay: string
  pixKey: string
}

export type SessionFormState = {
  studentId: string
  day: string
  time: string
  focus: string
  duration: number
}

export type QuickProtocolFormState = {
  workSets: string
  workReps: string
  workRpe: string
  rest: string
}

export type ManualExerciseFormState = {
  name: string
  muscleGroup: string
  category: string
  equipment: string
}

export type VideoAttachmentFormState = {
  rawUrl: string
  licenseLabel: string
  notes: string
}

export type StudentDemoContext = {
  exerciseName: string
  options: DemoViewerOption[]
  activeOption: DemoViewerOption | undefined
}

export type AppContextType = {
  // Auth
  authReady: boolean
  currentUser: User | null
  authMode: 'login' | 'signup'
  setAuthMode: (mode: 'login' | 'signup') => void
  authForm: { email: string; password: string }
  setAuthForm: Dispatch<SetStateAction<{ email: string; password: string }>>
  authLoading: boolean
  authMessage: string
  authStudentCode: string
  setAuthStudentCode: Dispatch<SetStateAction<string>>
  passwordRecoveryMode: boolean
  recoveryForm: { password: string; confirmPassword: string }
  setRecoveryForm: Dispatch<SetStateAction<{ password: string; confirmPassword: string }>>
  recoveryLoading: boolean
  recoveryMessage: string
  handleAuthSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleResendConfirmation: () => Promise<void>
  handlePasswordReset: () => Promise<void>
  handleCompletePasswordRecovery: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleCancelPasswordRecovery: () => void
  handleSignOut: () => Promise<void>

  // Trainer data
  trainerData: TrainerData
  students: Student[]
  sessions: Session[]
  selectedStudentId: string
  setSelectedStudentId: Dispatch<SetStateAction<string>>
  selectedStudent: Student | null
  doneSessions: string[]
  progressHistory: Record<string, ProgressHistoryEntry[]>
  selectedStudentHistory: ProgressHistoryEntry[]
  loading: boolean
  syncMessage: string
  setSyncMessage: Dispatch<SetStateAction<string>>

  // App mode
  appMode: 'trainer' | 'student'
  setAppMode: Dispatch<SetStateAction<'trainer' | 'student'>>
  studentPortal: StudentPortalData | null
  hasTrainerWorkspace: boolean

  // Student portal
  studentAccessCode: string
  setStudentAccessCode: Dispatch<SetStateAction<string>>
  linkingStudent: boolean
  handleClaimStudentAccess: (event: FormEvent<HTMLFormElement>) => Promise<void>

  // Navigation
  activeMenu: string
  handleMenuClick: (menu: string) => void

  // Schedule
  selectedDay: string
  setSelectedDay: Dispatch<SetStateAction<string>>
  weekSessions: Session[]
  sessionForm: SessionFormState
  setSessionForm: Dispatch<SetStateAction<SessionFormState>>
  editingSessionId: string | null
  setEditingSessionId: Dispatch<SetStateAction<string | null>>
  handleCreateSession: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleStartSessionEdit: (sessionId: string) => void
  handleCancelSessionEdit: () => void
  toggleSession: (sessionId: string) => void

  // Student CRUD
  studentForm: StudentFormState
  setStudentForm: Dispatch<SetStateAction<StudentFormState>>
  editingStudent: boolean
  setEditingStudent: Dispatch<SetStateAction<boolean>>
  studentEditForm: StudentFormState
  setStudentEditForm: Dispatch<SetStateAction<StudentFormState>>
  handleCreateStudent: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleStartStudentEdit: () => void
  handleCancelStudentEdit: () => void
  handleUpdateStudent: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleCopyStudentCode: (shareCode?: string) => Promise<void>
  handleShareStudentAccessLink: (student: Student) => Promise<void>
  handleUnlinkStudentAccess: (studentId: string) => Promise<void>

  // Workout builder
  workoutDraft: WorkoutDraftItem[]
  setWorkoutDraft: Dispatch<SetStateAction<WorkoutDraftItem[]>>
  editingDraftExerciseId: string | null
  setEditingDraftExerciseId: Dispatch<SetStateAction<string | null>>
  workoutBuilderOpen: boolean
  setWorkoutBuilderOpen: Dispatch<SetStateAction<boolean>>
  workoutBuilderStep: 'biblioteca' | 'protocolo'
  setWorkoutBuilderStep: Dispatch<SetStateAction<'biblioteca' | 'protocolo'>>
  workoutBuilderMode: 'simplificado' | 'pro'
  setWorkoutBuilderMode: Dispatch<SetStateAction<'simplificado' | 'pro'>>
  quickProtocolForm: QuickProtocolFormState
  setQuickProtocolForm: Dispatch<SetStateAction<QuickProtocolFormState>>
  quickAddExerciseName: string
  setQuickAddExerciseName: Dispatch<SetStateAction<string>>
  manualExerciseForm: ManualExerciseFormState
  setManualExerciseForm: Dispatch<SetStateAction<ManualExerciseFormState>>
  handleAddExerciseToDraft: (exercise: LibraryExercise, day?: string, routine?: string) => void
  handleRemoveDraftExercise: (draftId: string) => void
  handleUpdateDraftExercise: <K extends WorkoutDraftEditableField>(
    draftId: string,
    field: K,
    value: WorkoutDraftItem[K],
  ) => void
  handleSaveWorkoutDraft: () => Promise<void>
  handleApplyWorkoutTemplate: (template: WorkoutTemplate, day?: string, routine?: string) => void
  handleApplyQuickProtocol: (event: FormEvent<HTMLFormElement>) => void
  handleQuickAddExercise: (event: FormEvent<HTMLFormElement>, day?: string, routine?: string) => void
  handleAddManualExercise: (event: FormEvent<HTMLFormElement>, day?: string, routine?: string) => void

  // Exercise library
  exerciseQuery: string
  setExerciseQuery: Dispatch<SetStateAction<string>>
  groupFilter: string
  setGroupFilter: Dispatch<SetStateAction<string>>
  categoryFilter: string
  setCategoryFilter: Dispatch<SetStateAction<string>>
  equipmentFilter: string
  setEquipmentFilter: Dispatch<SetStateAction<string>>
  difficultyFilter: 'Todos' | 'beginner' | 'intermediate' | 'advanced'
  setDifficultyFilter: Dispatch<SetStateAction<'Todos' | 'beginner' | 'intermediate' | 'advanced'>>
  sourceFilter: 'Todos' | 'core' | 'animatic'
  setSourceFilter: Dispatch<SetStateAction<'Todos' | 'core' | 'animatic'>>
  filteredExercises: LibraryExercise[]
  quickAddExercises: LibraryExercise[]
  categoryOptions: string[]
  equipmentOptions: string[]
  sourceSummary: { core: number; animatic: number }

  // Exercise demo
  demoExercise: LibraryExercise | null
  setDemoExercise: Dispatch<SetStateAction<LibraryExercise | null>>
  demoModelIndex: number
  setDemoModelIndex: Dispatch<SetStateAction<number>>
  demoOptions: DemoViewerOption[]
  activeDemoOption: DemoViewerOption | undefined
  handleOpenExerciseDemo: (exercise: LibraryExercise) => void

  // Exercise videos
  exerciseVideoMap: Record<string, ExerciseVideoAttachment>
  exerciseVideoCloudStatus: ExerciseVideoCloudStatus
  videoAttachmentForm: VideoAttachmentFormState
  setVideoAttachmentForm: Dispatch<SetStateAction<VideoAttachmentFormState>>
  batchVideoInput: string
  setBatchVideoInput: Dispatch<SetStateAction<string>>
  batchVideoSaving: boolean
  rapidApiImporting: boolean
  handleSaveVideoAttachment: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleRemoveVideoAttachment: () => Promise<void>
  handleApplyBatchVideoAttachments: () => Promise<void>
  handleImportVideosFromExerciseDb: () => Promise<void>

  // Billing
  billingProfile: BillingProfile
  billingLoading: boolean
  activePlan: PlanDefinition
  handlePlanDemoSelect: (planId: PlanId) => Promise<void>
  handleCheckout: (planId: PlanId) => Promise<void>

  // Coach profile
  coachProfile: CoachProfile
  coachForm: CoachProfile
  setCoachForm: Dispatch<SetStateAction<CoachProfile>>
  handleSaveCoachProfile: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleCoachAvatarUpload: (event: ChangeEvent<HTMLInputElement>) => void

  // Rest timer
  restTimerTotalSeconds: number
  restTimerRemainingSeconds: number
  restTimerRunning: boolean
  restTimerInput: string
  setRestTimerInput: Dispatch<SetStateAction<string>>
  restTimerSource: string
  restTimerDone: boolean
  restTimerProgress: number
  applyRestTimer: (rawValue: string, source: string, autoStart: boolean) => void
  handleStartPauseTimer: () => void
  handleResetTimer: () => void
  handleApplyManualTimer: (event: FormEvent<HTMLFormElement>) => void

  // Student portal specifics
  studentPortalWeekSessions: Session[]
  studentPortalCompletionRate: number
  studentVideoExerciseName: string
  setStudentVideoExerciseName: Dispatch<SetStateAction<string>>
  studentDemoModelIndex: number
  setStudentDemoModelIndex: Dispatch<SetStateAction<number>>
  studentDemoContext: StudentDemoContext | null

  // Derived
  completionRate: number
  studentCapacityText: string
  coachInitial: string
  coachFormInitial: string
  selectedStudentWorkoutCount: number
  selectedStudentHistoryPreview: ProgressHistoryEntry[]
  workoutDraftGroups: [string, number][]

  // Render helpers
  renderDemoMedia: (option: DemoViewerOption | undefined, title: string) => ReactNode

  // Re-exported constants/utils for components
  mergedExerciseLibrary: LibraryExercise[]
  weekDays: string[]
  muscleGroups: readonly string[]
  planDefinitions: PlanDefinition[]
  hasSupabaseCredentials: boolean
  workoutTemplates: WorkoutTemplate[]
  navItems: NavItem[]
  studentSexOptions: readonly string[]
  studentTrainingLevelOptions: readonly string[]
  studentWorkoutTypeOptions: readonly string[]
  getExerciseDisplayName: (exerciseName: string) => string
  normalizeExerciseKey: (value: string) => string
  getStudentSex: (student: Student) => string
  getStudentTrainingLevel: (student: Student) => string
  getStudentWorkoutType: (student: Student) => string
  buildStudentFormFromStudent: (student: Student) => StudentFormState
  parseWorkoutProtocolFromExercise: (
    exercise: Exercise,
    muscleGroup: string,
  ) => Omit<WorkoutDraftItem, 'id' | 'name' | 'muscleGroup' | 'category' | 'equipment'>
  getExerciseRestPreset: (exercise: Exercise) => string
  findLibraryExerciseByName: (exerciseName: string) => LibraryExercise | undefined
  buildMuscleAndStrengthLookupUrl: (exerciseName: string, muscleGroup?: string) => string
  formatTimer: (seconds: number) => string
  getPlanDefinition: (id: PlanId) => PlanDefinition
}

export const AppContext = createContext<AppContextType | null>(null)
export const AuthContext = createContext<AppContextType | null>(null)
export const TrainerContext = createContext<AppContextType | null>(null)
export const WorkoutContext = createContext<AppContextType | null>(null)
export const BillingCoachContext = createContext<AppContextType | null>(null)
export const TimerPortalContext = createContext<AppContextType | null>(null)
export const MetaContext = createContext<AppContextType | null>(null)

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

const useSliceContext = (context: AppContextType | null, hookName: string): AppContextType => {
  if (!context) {
    throw new Error(`${hookName} must be used within an AppProvider`)
  }
  return context
}

export const useAuthContext = (): AppContextType =>
  useSliceContext(useContext(AuthContext), 'useAuthContext')

export const useTrainerContext = (): AppContextType =>
  useSliceContext(useContext(TrainerContext), 'useTrainerContext')

export const useWorkoutContext = (): AppContextType =>
  useSliceContext(useContext(WorkoutContext), 'useWorkoutContext')

export const useBillingCoachContext = (): AppContextType =>
  useSliceContext(useContext(BillingCoachContext), 'useBillingCoachContext')

export const useTimerPortalContext = (): AppContextType =>
  useSliceContext(useContext(TimerPortalContext), 'useTimerPortalContext')

export const useMetaContext = (): AppContextType =>
  useSliceContext(useContext(MetaContext), 'useMetaContext')
