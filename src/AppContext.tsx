import { useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { weekDays } from './data/mockData'
import { getPlanDefinition, planDefinitions } from './data/plans'
import { hasSupabaseCredentials } from './lib/supabase'
import { muscleGroups } from './data/exerciseLibrary'
import {
  defaultStudentForm,
  studentSexOptions,
  studentTrainingLevelOptions,
  studentWorkoutTypeOptions,
} from './constants/studentOptions'
import {
  normalizeExerciseKey,
  createId,
  getExerciseDisplayName,
  getMergedExerciseLibrary,
  findLibraryExerciseByName,
  navItems,
} from './utils/exerciseUtils'
import {
  buildStudentFormFromStudent,
  getStudentSex,
  getStudentTrainingLevel,
  getStudentWorkoutType,
} from './utils/studentUtils'
import { buildMuscleAndStrengthLookupUrl } from './utils/urlUtils'
import { formatTimer } from './utils/timerUtils'
import { parseWorkoutProtocolFromExercise, getExerciseRestPreset } from './utils/workoutProtocol'
import { workoutTemplates } from './constants/workoutTemplates'
import {
  AppContext,
  AuthContext,
  BillingCoachContext,
  MetaContext,
  TimerPortalContext,
  TrainerContext,
  WorkoutContext,
} from './context/appContextStore'
import { createAuthHandlers } from './context/handlers/authHandlers'
import { createBillingHandlers } from './context/handlers/billingHandlers'
import { createCoachHandlers } from './context/handlers/coachHandlers'
import { createNavigationHandlers } from './context/handlers/navigationHandlers'
import { createStudentHandlers } from './context/handlers/studentHandlers'
import { createTimerHandlers } from './context/handlers/timerHandlers'
import { createTrainerHandlers } from './context/handlers/trainerHandlers'
import { createWorkoutHandlers } from './context/handlers/workoutHandlers'
import { emptyTrainerData } from './context/constants/emptyTrainerData'
import {
  useAnimaticLibraryEffect,
  useAuthBootstrapEffect,
  useDataLoadEffect,
  useOfflineSyncQueueEffect,
  usePendingClaimEffect,
  usePersistenceEffects,
  useRestTimerEffects,
  useWorkoutDraftSyncEffect,
} from './context/effects/appEffects'
import {
  useAuthStateSlice,
  useBillingStateSlice,
  useCoachStateSlice,
  useDemoStateSlice,
  useExerciseFiltersStateSlice,
  useExerciseVideosStateSlice,
  useNavigationStateSlice,
  usePortalStateSlice,
  useSessionStateSlice,
  useStudentsCrudStateSlice,
  useTimerStateSlice,
  useTrainerStateSlice,
  useWorkoutBuilderStateSlice,
} from './context/state/appStateSlices'
import {
  useExerciseDemoDerivedState,
  useExerciseLibraryDerivedState,
  useMetaDerivedState,
  useTrainerDerivedState,
} from './context/derived/appDerivedState'
import { buildAppContextValue } from './context/factories/buildAppContextValue'
import { clearRecoveryUrlArtifacts } from './context/helpers/recoveryUrl'
import { renderDemoMedia } from './context/helpers/renderDemoMedia'
import { billingQueryKeys, portalQueryKeys, useBillingProfileQuery, useStudentPortalQuery } from './queries/accountQueries'
import { financeQueryKeys } from './queries/financeQueries'
import { trainerQueryKeys, useTrainerDataQuery } from './queries/trainerQueries'
import { setPlanManually } from './services/billingStore'
import {
  claimStudentAccess,
  loadStudentPortalData,
  saveExercisesRemotely,
  saveStudentRemotely,
  saveStudentWorkoutAtomicallyRemotely,
  updateStudentRemotely,
} from './services/trainerStore'

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AppProvider({ children }: { children: ReactNode }) {
  const [mergedExerciseLibrary, setMergedExerciseLibrary] = useState(() => getMergedExerciseLibrary())

  const {
    authReady,
    setAuthReady,
    currentUser,
    setCurrentUser,
    localAccessGranted,
    setLocalAccessGranted,
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
  } = useAuthStateSlice()

  const {
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
  } = useTrainerStateSlice()

  const {
    appMode,
    setAppMode,
    studentPortal,
    setStudentPortal,
    studentAccessCode,
    setStudentAccessCode,
    linkingStudent,
    setLinkingStudent,
  } = usePortalStateSlice()

  const { billingProfile, setBillingProfile, billingLoading, setBillingLoading } = useBillingStateSlice()

  const {
    studentForm,
    setStudentForm,
    editingStudent,
    setEditingStudent,
    studentEditForm,
    setStudentEditForm,
  } = useStudentsCrudStateSlice()

  const { sessionForm, setSessionForm, editingSessionId, setEditingSessionId } = useSessionStateSlice()

  const { activeMenu, setActiveMenu } = useNavigationStateSlice()

  const {
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
  } = useExerciseFiltersStateSlice()

  const {
    demoExercise,
    setDemoExercise,
    demoModelIndex,
    setDemoModelIndex,
    studentVideoExerciseName,
    setStudentVideoExerciseName,
    studentDemoModelIndex,
    setStudentDemoModelIndex,
  } = useDemoStateSlice()

  const {
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
  } = useExerciseVideosStateSlice()

  const {
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
  } = useWorkoutBuilderStateSlice()

  const { coachProfile, setCoachProfile, coachForm, setCoachForm } = useCoachStateSlice()

  const {
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
  } = useTimerStateSlice()

  const shouldLoadHeavyMedia = appMode === 'student' || activeMenu === 'Treinos'
  useAnimaticLibraryEffect(setMergedExerciseLibrary, shouldLoadHeavyMedia)

  const queryClient = useQueryClient()
  const trainerDataQuery = useTrainerDataQuery({ authReady, currentUser })
  const billingProfileQuery = useBillingProfileQuery({ authReady, currentUser })
  const studentPortalQuery = useStudentPortalQuery({ authReady, currentUser })
  const trainerQueryKey = trainerQueryKeys.data(hasSupabaseCredentials ? currentUser?.id : undefined)
  const billingQueryKey = billingQueryKeys.profile(hasSupabaseCredentials ? currentUser?.id : undefined)
  const portalQueryKey = portalQueryKeys.student(hasSupabaseCredentials ? currentUser?.id : undefined)

  const invalidateTrainerDataCache = () =>
    queryClient.invalidateQueries({
      queryKey: trainerQueryKey,
    })

  const invalidateBillingCache = () =>
    queryClient.invalidateQueries({
      queryKey: billingQueryKey,
    })

  const invalidateFinanceCache = () =>
    queryClient.invalidateQueries({
      queryKey: financeQueryKeys.all,
    })

  const invalidatePortalCache = () =>
    queryClient.invalidateQueries({
      queryKey: portalQueryKey,
    })

  const syncStudentCreateMutation = useMutation({
    mutationFn: async (input: { student: Parameters<typeof saveStudentRemotely>[0]; starterExercises: Parameters<typeof saveExercisesRemotely>[1]; userId: string }) => {
      const [savedStudent, exercisesSaved] = await Promise.all([
        saveStudentRemotely(input.student, input.userId),
        saveExercisesRemotely(input.student.id, input.starterExercises, input.userId),
      ])
      return { savedStudent, exercisesSaved }
    },
    onSuccess: () => {
      void invalidateTrainerDataCache()
    },
  })

  const syncStudentUpdateMutation = useMutation({
    mutationFn: async (input: { student: Parameters<typeof updateStudentRemotely>[0]; userId: string }) =>
      updateStudentRemotely(input.student, input.userId),
    onSuccess: () => {
      void invalidateTrainerDataCache()
    },
  })

  const syncWorkoutSaveMutation = useMutation({
    mutationFn: async (input: { studentId: string; workout: Parameters<typeof saveStudentWorkoutAtomicallyRemotely>[1]; userId: string }) =>
      saveStudentWorkoutAtomicallyRemotely(input.studentId, input.workout, input.userId),
    onSuccess: () => {
      void invalidateTrainerDataCache()
    },
  })

  const syncBillingPlanMutation = useMutation({
    mutationFn: async (input: { planId: Parameters<typeof setPlanManually>[0]; userId?: string }) =>
      setPlanManually(input.planId, input.userId),
    onSuccess: () => {
      void invalidateBillingCache()
    },
  })

  const syncClaimStudentAccessMutation = useMutation({
    mutationFn: async (input: { code: string; userId: string }) => {
      const claim = await claimStudentAccess(input.code)
      if (!claim.ok) return { ...claim, portal: null as Awaited<ReturnType<typeof loadStudentPortalData>> }
      const portal = await loadStudentPortalData(input.userId)
      return { ...claim, portal }
    },
    onSuccess: () => {
      void invalidatePortalCache()
      void invalidateTrainerDataCache()
    },
  })

  // ========================= EFFECTS =========================

  useAuthBootstrapEffect({
    setCurrentUser,
    setAuthReady,
    setPasswordRecoveryMode,
    setRecoveryMessage,
  })

  useDataLoadEffect({
    authReady,
    currentUser,
    trainerDataSnapshot: trainerDataQuery.data ?? null,
    trainerDataReady: trainerDataQuery.isSuccess,
    billingProfileSnapshot: billingProfileQuery.data ?? null,
    billingProfileReady: billingProfileQuery.isSuccess,
    studentPortalSnapshot: studentPortalQuery.data ?? null,
    studentPortalReady: studentPortalQuery.isSuccess,
    emptyTrainerData,
    setTrainerData,
    setDoneSessions,
    setProgressHistory,
    setSelectedStudentId,
    setSessionForm,
    setBillingProfile,
    setStudentPortal,
    setAppMode,
    setCoachProfile,
    setCoachForm,
    setExerciseVideoMap,
    setExerciseVideoCloudStatus,
    setLoading,
  })

  usePersistenceEffects({
    authReady,
    currentUser,
    doneSessions,
    progressHistory,
    trainerData,
    billingProfile,
    exerciseVideoMap,
    syncMessage,
    authMessage,
    setSyncMessage,
    setAuthMessage,
  })

  useOfflineSyncQueueEffect({
    authReady,
    currentUser,
    setSyncMessage,
  })

  usePendingClaimEffect({
    currentUser,
    pendingClaimCode,
    pendingClaimLoading,
    syncClaimStudentAccessRemote: async (inputCode) => {
      if (!currentUser) {
        return { ok: false, message: 'Faca login para vincular a conta de aluno.', portal: null }
      }
      return syncClaimStudentAccessMutation.mutateAsync({ code: inputCode, userId: currentUser.id })
    },
    setPendingClaimLoading,
    setAuthMessage,
    setPendingClaimCode,
    setAuthStudentCode,
    setStudentPortal,
    setAppMode,
    setSyncMessage,
  })

  useWorkoutDraftSyncEffect({
    selectedStudentId,
    workoutByStudent: trainerData.workoutByStudent,
    setWorkoutDraft,
    setDemoExercise,
    setEditingDraftExerciseId,
  })

  useRestTimerEffects({
    restTimerRunning,
    restTimerDone,
    setRestTimerRemainingSeconds,
    setRestTimerRunning,
    setRestTimerDone,
  })

  // ========================= DERIVED STATE =========================

  const {
    students,
    sessions,
    selectedStudent,
    selectedStudentHistory,
    weekSessions,
    completionRate,
    hasTrainerWorkspace,
    selectedStudentWorkoutCount,
    selectedStudentHistoryPreview,
  } = useTrainerDerivedState({
    trainerData,
    selectedStudentId,
    selectedDay,
    progressHistory,
    doneSessions,
  })

  const { categoryOptions, equipmentOptions, sourceSummary, filteredExercises, quickAddExercises } =
    useExerciseLibraryDerivedState({
      mergedExerciseLibrary,
      exerciseQuery,
      groupFilter,
      categoryFilter,
      equipmentFilter,
      difficultyFilter,
      sourceFilter,
      workoutDraft,
    })

  const {
    demoOptions,
    activeDemoOption,
    studentPortalWeekSessions,
    studentPortalCompletionRate,
    studentDemoContext,
  } = useExerciseDemoDerivedState({
    demoExercise,
    exerciseVideoMap,
    demoModelIndex,
    studentPortal,
    studentVideoExerciseName,
    studentDemoModelIndex,
    selectedDay,
    doneSessions,
  })

  const {
    activePlan,
    studentCapacityText,
    coachInitial,
    coachFormInitial,
    restTimerProgress,
    workoutDraftGroups,
  } = useMetaDerivedState({
    billingProfile,
    studentsCount: students.length,
    coachProfile,
    coachForm,
    restTimerTotalSeconds,
    restTimerRemainingSeconds,
    workoutDraft,
  })

  // ========================= EVENT HANDLERS =========================

  const { toggleSession } = createTrainerHandlers({
    sessions,
    doneSessions,
    students,
    currentUser,
    hasSupabaseCredentials,
    setDoneSessions,
    setTrainerData,
    setStudentPortal,
    setProgressHistory,
    setSyncMessage,
    createId,
  })

  const { handleMenuClick } = createNavigationHandlers({
    setActiveMenu,
    setWorkoutBuilderOpen,
    setWorkoutBuilderStep,
  })

  const { handleSaveCoachProfile, handleCoachAvatarUpload } = createCoachHandlers({
    coachForm,
    currentUser,
    hasSupabaseCredentials,
    setSyncMessage,
    setCoachProfile,
    setCoachForm,
  })

  const {
    handleAuthSubmit,
    handleResendConfirmation,
    handlePasswordReset,
    handleCompletePasswordRecovery,
    handleCancelPasswordRecovery,
    handleSignOut,
    handleClaimStudentAccess,
  } = createAuthHandlers({
    hasSupabaseCredentials,
    setLocalAccessGranted,
    authForm,
    authStudentCode,
    authMode,
    recoveryForm,
    currentUser,
    studentAccessCode,
    setAuthMessage,
    setAuthLoading,
    setLoading,
    setAuthForm,
    setPendingClaimCode,
    setRecoveryLoading,
    setRecoveryMessage,
    setRecoveryForm,
    setPasswordRecoveryMode,
    setSyncMessage,
    setLinkingStudent,
    setStudentPortal,
    setAppMode,
    setStudentAccessCode,
    syncClaimStudentAccessRemote: async (inputCode) => {
      if (!currentUser) {
        return { ok: false, message: 'Faca login para vincular a conta de aluno.', portal: null }
      }
      return syncClaimStudentAccessMutation.mutateAsync({ code: inputCode, userId: currentUser.id })
    },
    clearRecoveryUrlArtifacts,
  })

  const { handlePlanDemoSelect, handleCheckout } = createBillingHandlers({
    currentUser,
    setSyncMessage,
    setBillingLoading,
    syncSetBillingPlanRemote: syncBillingPlanMutation.mutateAsync,
  })

  const {
    handleCreateStudent,
    handleStartStudentEdit,
    handleCancelStudentEdit,
    handleUpdateStudent,
    handleCreateSession,
    handleStartSessionEdit,
    handleCancelSessionEdit,
    handleCopyStudentCode,
    handleShareStudentAccessLink,
    handleUnlinkStudentAccess,
  } = createStudentHandlers({
    billingProfile,
    activePlanName: activePlan.name,
    students,
    selectedStudent,
    studentForm,
    studentEditForm,
    sessionForm,
    editingSessionId,
    sessions,
    currentUser,
    hasSupabaseCredentials,
    studentPortal,
    defaultStudentForm,
    buildStudentFormFromStudent,
    createId,
    syncCreateStudentRemote: syncStudentCreateMutation.mutateAsync,
    syncUpdateStudentRemote: syncStudentUpdateMutation.mutateAsync,
    setSyncMessage,
    setTrainerData,
    setSelectedStudentId,
    setEditingStudent,
    setSessionForm,
    setEditingSessionId,
    setStudentForm,
    setStudentEditForm,
    setStudentPortal,
    setAppMode,
    invalidateFinanceCache,
  })

  const {
    handleOpenExerciseDemo,
    handleSaveVideoAttachment,
    handleRemoveVideoAttachment,
    handleImportVideosFromExerciseDb,
    handleApplyBatchVideoAttachments,
    handleApplyWorkoutTemplate,
    handleApplyQuickProtocol,
    handleAddExerciseToDraft,
    handleQuickAddExercise,
    handleRemoveDraftExercise,
    handleUpdateDraftExercise,
    handleSaveWorkoutDraft,
    handleAddManualExercise,
  } = createWorkoutHandlers({
    mergedExerciseLibrary,
    exerciseVideoMap,
    demoExercise,
    videoAttachmentForm,
    batchVideoInput,
    selectedStudent,
    workoutDraft,
    quickProtocolForm,
    quickAddExerciseName,
    manualExerciseForm,
    selectedStudentId,
    currentUser,
    hasSupabaseCredentials,
    setVideoAttachmentForm,
    setDemoExercise,
    setDemoModelIndex,
    setExerciseVideoMap,
    setExerciseVideoCloudStatus,
    setSyncMessage,
    setRapidApiImporting,
    setBatchVideoSaving,
    setBatchVideoInput,
    setWorkoutDraft,
    setEditingDraftExerciseId,
    setWorkoutBuilderStep,
    setQuickAddExerciseName,
    setManualExerciseForm,
    setTrainerData,
    syncSaveWorkoutRemote: syncWorkoutSaveMutation.mutateAsync,
    createId,
  })

  const {
    applyRestTimer,
    handleStartPauseTimer,
    handleResetTimer,
    handleApplyManualTimer,
  } = createTimerHandlers({
    restTimerRunning,
    restTimerRemainingSeconds,
    restTimerTotalSeconds,
    restTimerInput,
    setSyncMessage,
    setRestTimerTotalSeconds,
    setRestTimerRemainingSeconds,
    setRestTimerInput,
    setRestTimerSource,
    setRestTimerDone,
    setRestTimerRunning,
  })

  // ========================= CONTEXT VALUE =========================
  const authContextInput = useMemo(() => ({
    authReady,
    currentUser,
    localAccessGranted,
    setLocalAccessGranted,
    authMode,
    setAuthMode,
    authForm,
    setAuthForm,
    authLoading,
    authMessage,
    authStudentCode,
    setAuthStudentCode,
    passwordRecoveryMode,
    recoveryForm,
    setRecoveryForm,
    recoveryLoading,
    recoveryMessage,
    handleAuthSubmit,
    handleResendConfirmation,
    handlePasswordReset,
    handleCompletePasswordRecovery,
    handleCancelPasswordRecovery,
    handleSignOut,
  } as const), [
    authReady,
    currentUser,
    localAccessGranted,
    setLocalAccessGranted,
    authMode,
    setAuthMode,
    authForm,
    setAuthForm,
    authLoading,
    authMessage,
    authStudentCode,
    setAuthStudentCode,
    passwordRecoveryMode,
    recoveryForm,
    setRecoveryForm,
    recoveryLoading,
    recoveryMessage,
    handleAuthSubmit,
    handleResendConfirmation,
    handlePasswordReset,
    handleCompletePasswordRecovery,
    handleCancelPasswordRecovery,
    handleSignOut,
  ])

  const trainerContextInput = useMemo(() => ({
    trainerData,
    students,
    sessions,
    selectedStudentId,
    setSelectedStudentId,
    selectedStudent,
    doneSessions,
    progressHistory,
    selectedStudentHistory,
    loading,
    syncMessage,
    setSyncMessage,
    appMode,
    setAppMode,
    studentPortal,
    hasTrainerWorkspace,
    activeMenu,
    handleMenuClick,
    selectedDay,
    setSelectedDay,
    weekSessions,
    sessionForm,
    setSessionForm,
    editingSessionId,
    setEditingSessionId,
    handleCreateSession,
    handleStartSessionEdit,
    handleCancelSessionEdit,
    toggleSession,
    studentForm,
    setStudentForm,
    editingStudent,
    setEditingStudent,
    studentEditForm,
    setStudentEditForm,
    handleCreateStudent,
    handleStartStudentEdit,
    handleCancelStudentEdit,
    handleUpdateStudent,
    handleCopyStudentCode,
    handleShareStudentAccessLink,
    handleUnlinkStudentAccess,
  } as const), [
    trainerData,
    students,
    sessions,
    selectedStudentId,
    setSelectedStudentId,
    selectedStudent,
    doneSessions,
    progressHistory,
    selectedStudentHistory,
    loading,
    syncMessage,
    setSyncMessage,
    appMode,
    setAppMode,
    studentPortal,
    hasTrainerWorkspace,
    activeMenu,
    handleMenuClick,
    selectedDay,
    setSelectedDay,
    weekSessions,
    sessionForm,
    setSessionForm,
    editingSessionId,
    setEditingSessionId,
    handleCreateSession,
    handleStartSessionEdit,
    handleCancelSessionEdit,
    toggleSession,
    studentForm,
    setStudentForm,
    editingStudent,
    setEditingStudent,
    studentEditForm,
    setStudentEditForm,
    handleCreateStudent,
    handleStartStudentEdit,
    handleCancelStudentEdit,
    handleUpdateStudent,
    handleCopyStudentCode,
    handleShareStudentAccessLink,
    handleUnlinkStudentAccess,
  ])

  const workoutContextInput = useMemo(() => ({
    workoutDraft,
    setWorkoutDraft,
    editingDraftExerciseId,
    setEditingDraftExerciseId,
    workoutBuilderOpen,
    setWorkoutBuilderOpen,
    workoutBuilderStep,
    setWorkoutBuilderStep,
    workoutBuilderMode,
    setWorkoutBuilderMode,
    quickProtocolForm,
    setQuickProtocolForm,
    quickAddExerciseName,
    setQuickAddExerciseName,
    manualExerciseForm,
    setManualExerciseForm,
    handleAddExerciseToDraft,
    handleRemoveDraftExercise,
    handleUpdateDraftExercise,
    handleSaveWorkoutDraft,
    handleApplyWorkoutTemplate,
    handleApplyQuickProtocol,
    handleQuickAddExercise,
    handleAddManualExercise,
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
    filteredExercises,
    quickAddExercises,
    categoryOptions,
    equipmentOptions,
    sourceSummary,
    demoExercise,
    setDemoExercise,
    demoModelIndex,
    setDemoModelIndex,
    demoOptions,
    activeDemoOption,
    handleOpenExerciseDemo,
    exerciseVideoMap,
    exerciseVideoCloudStatus,
    videoAttachmentForm,
    setVideoAttachmentForm,
    batchVideoInput,
    setBatchVideoInput,
    batchVideoSaving,
    rapidApiImporting,
    handleSaveVideoAttachment,
    handleRemoveVideoAttachment,
    handleApplyBatchVideoAttachments,
    handleImportVideosFromExerciseDb,
  } as const), [
    workoutDraft,
    setWorkoutDraft,
    editingDraftExerciseId,
    setEditingDraftExerciseId,
    workoutBuilderOpen,
    setWorkoutBuilderOpen,
    workoutBuilderStep,
    setWorkoutBuilderStep,
    workoutBuilderMode,
    setWorkoutBuilderMode,
    quickProtocolForm,
    setQuickProtocolForm,
    quickAddExerciseName,
    setQuickAddExerciseName,
    manualExerciseForm,
    setManualExerciseForm,
    handleAddExerciseToDraft,
    handleRemoveDraftExercise,
    handleUpdateDraftExercise,
    handleSaveWorkoutDraft,
    handleApplyWorkoutTemplate,
    handleApplyQuickProtocol,
    handleQuickAddExercise,
    handleAddManualExercise,
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
    filteredExercises,
    quickAddExercises,
    categoryOptions,
    equipmentOptions,
    sourceSummary,
    demoExercise,
    setDemoExercise,
    demoModelIndex,
    setDemoModelIndex,
    demoOptions,
    activeDemoOption,
    handleOpenExerciseDemo,
    exerciseVideoMap,
    exerciseVideoCloudStatus,
    videoAttachmentForm,
    setVideoAttachmentForm,
    batchVideoInput,
    setBatchVideoInput,
    batchVideoSaving,
    rapidApiImporting,
    handleSaveVideoAttachment,
    handleRemoveVideoAttachment,
    handleApplyBatchVideoAttachments,
    handleImportVideosFromExerciseDb,
  ])

  const billingAndCoachContextInput = useMemo(() => ({
    billingProfile,
    billingLoading,
    activePlan,
    handlePlanDemoSelect,
    handleCheckout,
    coachProfile,
    coachForm,
    setCoachForm,
    handleSaveCoachProfile,
    handleCoachAvatarUpload,
  } as const), [
    billingProfile,
    billingLoading,
    activePlan,
    handlePlanDemoSelect,
    handleCheckout,
    coachProfile,
    coachForm,
    setCoachForm,
    handleSaveCoachProfile,
    handleCoachAvatarUpload,
  ])

  const timerAndStudentPortalContextInput = useMemo(() => ({
    restTimerTotalSeconds,
    restTimerRemainingSeconds,
    restTimerRunning,
    restTimerInput,
    setRestTimerInput,
    restTimerSource,
    restTimerDone,
    restTimerProgress,
    applyRestTimer,
    handleStartPauseTimer,
    handleResetTimer,
    handleApplyManualTimer,
    studentAccessCode,
    setStudentAccessCode,
    linkingStudent,
    handleClaimStudentAccess,
    studentPortalWeekSessions,
    studentPortalCompletionRate,
    studentVideoExerciseName,
    setStudentVideoExerciseName,
    studentDemoModelIndex,
    setStudentDemoModelIndex,
    studentDemoContext,
  } as const), [
    restTimerTotalSeconds,
    restTimerRemainingSeconds,
    restTimerRunning,
    restTimerInput,
    setRestTimerInput,
    restTimerSource,
    restTimerDone,
    restTimerProgress,
    applyRestTimer,
    handleStartPauseTimer,
    handleResetTimer,
    handleApplyManualTimer,
    studentAccessCode,
    setStudentAccessCode,
    linkingStudent,
    handleClaimStudentAccess,
    studentPortalWeekSessions,
    studentPortalCompletionRate,
    studentVideoExerciseName,
    setStudentVideoExerciseName,
    studentDemoModelIndex,
    setStudentDemoModelIndex,
    studentDemoContext,
  ])

  const metaContextInput = useMemo(() => ({
    completionRate,
    studentCapacityText,
    coachInitial,
    coachFormInitial,
    selectedStudentWorkoutCount,
    selectedStudentHistoryPreview,
    workoutDraftGroups,
    renderDemoMedia,
    mergedExerciseLibrary,
    weekDays,
    muscleGroups,
    planDefinitions,
    hasSupabaseCredentials,
    workoutTemplates,
    navItems,
    studentSexOptions,
    studentTrainingLevelOptions,
    studentWorkoutTypeOptions,
    getExerciseDisplayName,
    normalizeExerciseKey,
    getStudentSex,
    getStudentTrainingLevel,
    getStudentWorkoutType,
    buildStudentFormFromStudent,
    parseWorkoutProtocolFromExercise,
    getExerciseRestPreset,
    findLibraryExerciseByName,
    buildMuscleAndStrengthLookupUrl,
    formatTimer,
    getPlanDefinition,
  } as const), [
    completionRate,
    studentCapacityText,
    coachInitial,
    coachFormInitial,
    selectedStudentWorkoutCount,
    selectedStudentHistoryPreview,
    workoutDraftGroups,
    mergedExerciseLibrary,
  ])

  const value = useMemo(() => buildAppContextValue({
    authContextInput,
    trainerContextInput,
    workoutContextInput,
    billingAndCoachContextInput,
    timerAndStudentPortalContextInput,
    metaContextInput,
  }), [
    authContextInput,
    trainerContextInput,
    workoutContextInput,
    billingAndCoachContextInput,
    timerAndStudentPortalContextInput,
    metaContextInput,
  ])

  return (
    <AppContext.Provider value={value}>
      <AuthContext.Provider value={authContextInput as unknown as typeof value}>
        <TrainerContext.Provider value={trainerContextInput as unknown as typeof value}>
          <WorkoutContext.Provider value={workoutContextInput as unknown as typeof value}>
            <BillingCoachContext.Provider value={billingAndCoachContextInput as unknown as typeof value}>
              <TimerPortalContext.Provider value={timerAndStudentPortalContextInput as unknown as typeof value}>
                <MetaContext.Provider value={metaContextInput as unknown as typeof value}>
                  {children}
                </MetaContext.Provider>
              </TimerPortalContext.Provider>
            </BillingCoachContext.Provider>
          </WorkoutContext.Provider>
        </TrainerContext.Provider>
      </AuthContext.Provider>
    </AppContext.Provider>
  )
}
