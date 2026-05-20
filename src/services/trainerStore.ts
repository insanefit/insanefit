// ---------------------------------------------------------------------------
// Barrel re-export — mantém compatibilidade total com imports existentes.
// Toda a lógica foi extraída para serviços por domínio.
// ---------------------------------------------------------------------------

// Storage & shared helpers
export {
  persistLocalTrainerData,
  loadDoneSessions,
  persistDoneSessions,
} from './storage'

// Auth
export {
  getCurrentUser,
  subscribeAuthState,
  signIn,
  signUp,
  resendSignupConfirmation,
  sendPasswordReset,
  updateUserPassword,
  signOut,
} from './authService'

// Student CRUD & data loading
export {
  loadTrainerData,
  saveStudentRemotely,
  updateStudentRemotely,
  deleteStudentRemotely,
  purgeStudentFromLocalCaches,
  markStudentLocallyDeleted,
} from './studentService'

// Workout / exercises
export {
  saveExercisesRemotely,
  replaceExercisesRemotely,
  saveStudentWorkoutAtomicallyRemotely,
  syncStudentProgressAtomicallyRemotely,
} from './workoutService'

// Portal
export {
  loadStudentPortalData,
  claimStudentAccess,
  unlinkStudentAccessRemotely,
} from './portalService'

// Videos
export {
  loadExerciseVideoMapRemotely,
  saveExerciseVideoAttachmentRemotely,
  saveExerciseVideoMapRemotely,
  removeExerciseVideoAttachmentRemotely,
} from './videoService'

// Sessions
export {
  saveSessionRemotely,
  updateSessionRemotely,
} from './sessionService'
