import type { AppContextType } from '../appContextStore'

export type ContextInputs = {
  authContextInput: object
  trainerContextInput: object
  workoutContextInput: object
  billingAndCoachContextInput: object
  timerAndStudentPortalContextInput: object
  metaContextInput: object
}

const pickContextKeys = <K extends keyof AppContextType>(
  source: AppContextType,
  keys: ReadonlyArray<K>,
): Pick<AppContextType, K> => {
  const output = {} as Pick<AppContextType, K>
  keys.forEach((key) => {
    output[key] = source[key]
  })
  return output
}

const authKeys = [
  'authReady',
  'currentUser',
  'authMode',
  'setAuthMode',
  'authForm',
  'setAuthForm',
  'authLoading',
  'authMessage',
  'authStudentCode',
  'setAuthStudentCode',
  'passwordRecoveryMode',
  'recoveryForm',
  'setRecoveryForm',
  'recoveryLoading',
  'recoveryMessage',
  'handleAuthSubmit',
  'handleResendConfirmation',
  'handlePasswordReset',
  'handleCompletePasswordRecovery',
  'handleCancelPasswordRecovery',
  'handleSignOut',
] as const satisfies ReadonlyArray<keyof AppContextType>

const trainerKeys = [
  'trainerData',
  'students',
  'sessions',
  'selectedStudentId',
  'setSelectedStudentId',
  'selectedStudent',
  'doneSessions',
  'progressHistory',
  'selectedStudentHistory',
  'loading',
  'syncMessage',
  'setSyncMessage',
  'appMode',
  'setAppMode',
  'studentPortal',
  'hasTrainerWorkspace',
  'activeMenu',
  'handleMenuClick',
  'selectedDay',
  'setSelectedDay',
  'weekSessions',
  'sessionForm',
  'setSessionForm',
  'editingSessionId',
  'setEditingSessionId',
  'handleCreateSession',
  'handleStartSessionEdit',
  'handleCancelSessionEdit',
  'toggleSession',
  'studentForm',
  'setStudentForm',
  'editingStudent',
  'setEditingStudent',
  'studentEditForm',
  'setStudentEditForm',
  'handleCreateStudent',
  'handleStartStudentEdit',
  'handleCancelStudentEdit',
  'handleUpdateStudent',
  'handleCopyStudentCode',
  'handleShareStudentAccessLink',
  'handleUnlinkStudentAccess',
] as const satisfies ReadonlyArray<keyof AppContextType>

const workoutKeys = [
  'workoutDraft',
  'setWorkoutDraft',
  'editingDraftExerciseId',
  'setEditingDraftExerciseId',
  'workoutBuilderOpen',
  'setWorkoutBuilderOpen',
  'workoutBuilderStep',
  'setWorkoutBuilderStep',
  'workoutBuilderMode',
  'setWorkoutBuilderMode',
  'quickProtocolForm',
  'setQuickProtocolForm',
  'quickAddExerciseName',
  'setQuickAddExerciseName',
  'manualExerciseForm',
  'setManualExerciseForm',
  'handleAddExerciseToDraft',
  'handleRemoveDraftExercise',
  'handleUpdateDraftExercise',
  'handleSaveWorkoutDraft',
  'handleApplyWorkoutTemplate',
  'handleApplyQuickProtocol',
  'handleQuickAddExercise',
  'handleAddManualExercise',
  'exerciseQuery',
  'setExerciseQuery',
  'groupFilter',
  'setGroupFilter',
  'categoryFilter',
  'setCategoryFilter',
  'equipmentFilter',
  'setEquipmentFilter',
  'difficultyFilter',
  'setDifficultyFilter',
  'sourceFilter',
  'setSourceFilter',
  'filteredExercises',
  'quickAddExercises',
  'categoryOptions',
  'equipmentOptions',
  'sourceSummary',
  'demoExercise',
  'setDemoExercise',
  'demoModelIndex',
  'setDemoModelIndex',
  'demoOptions',
  'activeDemoOption',
  'handleOpenExerciseDemo',
  'exerciseVideoMap',
  'exerciseVideoCloudStatus',
  'videoAttachmentForm',
  'setVideoAttachmentForm',
  'batchVideoInput',
  'setBatchVideoInput',
  'batchVideoSaving',
  'rapidApiImporting',
  'handleSaveVideoAttachment',
  'handleRemoveVideoAttachment',
  'handleApplyBatchVideoAttachments',
  'handleImportVideosFromExerciseDb',
] as const satisfies ReadonlyArray<keyof AppContextType>

const billingAndCoachKeys = [
  'billingProfile',
  'billingLoading',
  'activePlan',
  'handlePlanDemoSelect',
  'handleCheckout',
  'coachProfile',
  'coachForm',
  'setCoachForm',
  'handleSaveCoachProfile',
  'handleCoachAvatarUpload',
] as const satisfies ReadonlyArray<keyof AppContextType>

const timerAndStudentPortalKeys = [
  'restTimerTotalSeconds',
  'restTimerRemainingSeconds',
  'restTimerRunning',
  'restTimerInput',
  'setRestTimerInput',
  'restTimerSource',
  'restTimerDone',
  'restTimerProgress',
  'applyRestTimer',
  'handleStartPauseTimer',
  'handleResetTimer',
  'handleApplyManualTimer',
  'studentAccessCode',
  'setStudentAccessCode',
  'linkingStudent',
  'handleClaimStudentAccess',
  'studentPortalWeekSessions',
  'studentPortalCompletionRate',
  'studentVideoExerciseName',
  'setStudentVideoExerciseName',
  'studentDemoModelIndex',
  'setStudentDemoModelIndex',
  'studentDemoContext',
] as const satisfies ReadonlyArray<keyof AppContextType>

const metaKeys = [
  'completionRate',
  'studentCapacityText',
  'coachInitial',
  'coachFormInitial',
  'selectedStudentWorkoutCount',
  'selectedStudentHistoryPreview',
  'workoutDraftGroups',
  'renderDemoMedia',
  'mergedExerciseLibrary',
  'weekDays',
  'muscleGroups',
  'planDefinitions',
  'hasSupabaseCredentials',
  'workoutTemplates',
  'navItems',
  'studentSexOptions',
  'studentTrainingLevelOptions',
  'studentWorkoutTypeOptions',
  'getExerciseDisplayName',
  'normalizeExerciseKey',
  'getStudentSex',
  'getStudentTrainingLevel',
  'getStudentWorkoutType',
  'buildStudentFormFromStudent',
  'parseWorkoutProtocolFromExercise',
  'getExerciseRestPreset',
  'findLibraryExerciseByName',
  'buildMuscleAndStrengthLookupUrl',
  'formatTimer',
  'getPlanDefinition',
] as const satisfies ReadonlyArray<keyof AppContextType>

const createContextSectionsInput = ({
  authContextInput,
  trainerContextInput,
  workoutContextInput,
  billingAndCoachContextInput,
  timerAndStudentPortalContextInput,
  metaContextInput,
}: ContextInputs): AppContextType =>
  ({
    ...authContextInput,
    ...trainerContextInput,
    ...workoutContextInput,
    ...billingAndCoachContextInput,
    ...timerAndStudentPortalContextInput,
    ...metaContextInput,
  }) as AppContextType

const createAppContextSections = (context: AppContextType): ReadonlyArray<Partial<AppContextType>> => [
  pickContextKeys(context, authKeys),
  pickContextKeys(context, trainerKeys),
  pickContextKeys(context, workoutKeys),
  pickContextKeys(context, billingAndCoachKeys),
  pickContextKeys(context, timerAndStudentPortalKeys),
  pickContextKeys(context, metaKeys),
]

const createAppContextValue = (sections: ReadonlyArray<Partial<AppContextType>>): AppContextType =>
  Object.assign({}, ...sections) as AppContextType

export const buildAppContextValue = (inputs: ContextInputs): AppContextType =>
  createAppContextValue(createAppContextSections(createContextSectionsInput(inputs)))
