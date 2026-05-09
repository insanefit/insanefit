import type { User } from '@supabase/supabase-js'
import { useEffect, type Dispatch, type SetStateAction } from 'react'
import { defaultBillingProfile, persistLocalBillingProfile } from '../../services/billingStore'
import { defaultCoachProfile, loadCoachProfile } from '../../services/coachStore'
import {
  getCurrentUser,
  loadDoneSessions,
  loadExerciseVideoMapRemotely,
  persistDoneSessions,
  persistLocalTrainerData,
  saveExerciseVideoMapRemotely,
  subscribeAuthState,
} from '../../services/trainerStore'
import { hasSupabaseCredentials } from '../../lib/supabase'
import {
  EXERCISE_VIDEO_MAP_STORAGE_KEY,
  loadAnimaticLibrary,
  loadBundledExerciseVideoMap,
  loadLocalExerciseVideoMap,
} from '../../utils/exerciseUtils'
import { loadProgressHistory, persistProgressHistory } from '../../utils/progressUtils'
import { workoutToDraft } from '../../utils/workoutProtocol'
import { flushSyncQueue, getSyncQueueCount } from '../../services/offlineSyncQueue'
import { cancelIdleTask, scheduleIdleTask } from '../../utils/idle'
import type { CoachProfile } from '../../types/coach'
import type { StudentPortalData, TrainerData, WorkoutByStudent } from '../../types/trainer'
import type { BillingProfile } from '../../types/billing'
import type { ExerciseVideoAttachment, ExerciseVideoCloudStatus } from '../../types/video'
import type { ProgressHistoryEntry, WorkoutDraftItem } from '../../types/workout'
import type { LibraryExercise } from '../../data/exerciseLibrary'

type SessionFormState = {
  studentId: string
  day: string
  time: string
  focus: string
  duration: number
}

type AppMode = 'trainer' | 'student'

type AuthBootstrapDeps = {
  setCurrentUser: Dispatch<SetStateAction<User | null>>
  setAuthReady: Dispatch<SetStateAction<boolean>>
  setPasswordRecoveryMode: Dispatch<SetStateAction<boolean>>
  setRecoveryMessage: Dispatch<SetStateAction<string>>
}

export const useAnimaticLibraryEffect = (
  setMergedExerciseLibrary: Dispatch<SetStateAction<LibraryExercise[]>>,
  shouldLoadHeavyMedia: boolean,
) => {
  useEffect(() => {
    if (!shouldLoadHeavyMedia) return
    let cancelled = false
    const idleHandle = scheduleIdleTask(() => {
      void loadBundledExerciseVideoMap()
    })
    loadAnimaticLibrary().then((merged) => {
      if (!cancelled) {
        setMergedExerciseLibrary(merged)
      }
    })
    return () => {
      cancelled = true
      cancelIdleTask(idleHandle)
    }
  }, [setMergedExerciseLibrary, shouldLoadHeavyMedia])
}

export const useAuthBootstrapEffect = ({
  setCurrentUser,
  setAuthReady,
  setPasswordRecoveryMode,
  setRecoveryMessage,
}: AuthBootstrapDeps) => {
  useEffect(() => {
    if (!hasSupabaseCredentials) return
    let isMounted = true

    const bootstrapAuth = async () => {
      const user = await getCurrentUser()
      if (!isMounted) return
      setCurrentUser(user)
      setAuthReady(true)
    }

    bootstrapAuth()

    const subscription = subscribeAuthState((event, session) => {
      if (!isMounted) return
      setCurrentUser(session?.user ?? null)
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryMode(true)
        setRecoveryMessage('Defina sua nova senha para concluir o acesso.')
      }
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [setAuthReady, setCurrentUser, setPasswordRecoveryMode, setRecoveryMessage])
}

type DataLoadDeps = {
  authReady: boolean
  currentUser: User | null
  trainerDataCurrent: TrainerData
  trainerDataSnapshot: TrainerData | null
  trainerDataReady: boolean
  billingProfileSnapshot: BillingProfile | null
  billingProfileReady: boolean
  studentPortalSnapshot: StudentPortalData | null
  studentPortalReady: boolean
  emptyTrainerData: TrainerData
  setTrainerData: Dispatch<SetStateAction<TrainerData>>
  setDoneSessions: Dispatch<SetStateAction<string[]>>
  setProgressHistory: Dispatch<SetStateAction<Record<string, ProgressHistoryEntry[]>>>
  setSelectedStudentId: Dispatch<SetStateAction<string>>
  setSessionForm: Dispatch<SetStateAction<SessionFormState>>
  setBillingProfile: Dispatch<SetStateAction<BillingProfile>>
  setStudentPortal: Dispatch<SetStateAction<StudentPortalData | null>>
  setAppMode: Dispatch<SetStateAction<AppMode>>
  setCoachProfile: Dispatch<SetStateAction<CoachProfile>>
  setCoachForm: Dispatch<SetStateAction<CoachProfile>>
  setExerciseVideoMap: Dispatch<SetStateAction<Record<string, ExerciseVideoAttachment>>>
  setExerciseVideoCloudStatus: Dispatch<SetStateAction<ExerciseVideoCloudStatus>>
  setLoading: Dispatch<SetStateAction<boolean>>
}

export const useDataLoadEffect = ({
  authReady,
  currentUser,
  trainerDataCurrent,
  trainerDataSnapshot,
  trainerDataReady,
  billingProfileSnapshot,
  billingProfileReady,
  studentPortalSnapshot,
  studentPortalReady,
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
}: DataLoadDeps) => {
  useEffect(() => {
    if (!authReady) return
    if (
      hasSupabaseCredentials &&
      currentUser &&
      (!trainerDataReady || !billingProfileReady || !studentPortalReady)
    ) {
      return
    }
    let isMounted = true

    const loadData = async () => {
      if (hasSupabaseCredentials && !currentUser) {
        if (!isMounted) return
        setTrainerData(emptyTrainerData)
        setDoneSessions([])
        setProgressHistory({})
        setSelectedStudentId('')
        setSessionForm((current) => ({ ...current, studentId: '' }))
        setBillingProfile(defaultBillingProfile)
        setStudentPortal(null)
        setAppMode('trainer')
        setCoachProfile(defaultCoachProfile)
        setCoachForm(defaultCoachProfile)
        setExerciseVideoMap(loadLocalExerciseVideoMap())
        setExerciseVideoCloudStatus('idle')
        setLoading(false)
        return
      }

      const userId = hasSupabaseCredentials ? currentUser?.id : undefined
      const [coach, remoteVideoMapResult] = await Promise.all([
        loadCoachProfile(userId),
        hasSupabaseCredentials && userId
          ? loadExerciseVideoMapRemotely(userId)
          : Promise.resolve({ ok: false, map: loadLocalExerciseVideoMap(), tableMissing: false }),
      ])

      if (!isMounted) return

      const snapshotData = trainerDataSnapshot ?? emptyTrainerData
      const shouldPreserveLocalTrainerData =
        hasSupabaseCredentials &&
        Boolean(currentUser) &&
        trainerDataCurrent.students.length > 0 &&
        snapshotData.students.length === 0

      const data = shouldPreserveLocalTrainerData ? trainerDataCurrent : snapshotData

      setTrainerData(data)
      setBillingProfile(billingProfileSnapshot ?? defaultBillingProfile)
      setStudentPortal(studentPortalSnapshot ?? null)
      setDoneSessions(loadDoneSessions(userId))
      setProgressHistory(loadProgressHistory(userId))
      setCoachProfile(coach)
      setCoachForm(coach)

      if (!hasSupabaseCredentials || !userId) {
        setExerciseVideoMap(loadLocalExerciseVideoMap())
        setExerciseVideoCloudStatus('idle')
      } else if (remoteVideoMapResult.ok) {
        const remoteMap = remoteVideoMapResult.map
        const remoteEntriesCount = Object.keys(remoteMap).length
        const localMap = loadLocalExerciseVideoMap()

        if (remoteEntriesCount === 0 && Object.keys(localMap).length > 0) {
          const sync = await saveExerciseVideoMapRemotely(userId, localMap)
          if (sync.ok) {
            setExerciseVideoMap(localMap)
            setExerciseVideoCloudStatus('ready')
          } else {
            setExerciseVideoMap(localMap)
            setExerciseVideoCloudStatus(sync.tableMissing ? 'missing_table' : 'error')
          }
        } else {
          setExerciseVideoMap(remoteMap)
          setExerciseVideoCloudStatus('ready')
        }
      } else {
        setExerciseVideoMap(loadLocalExerciseVideoMap())
        setExerciseVideoCloudStatus(remoteVideoMapResult.tableMissing ? 'missing_table' : 'error')
      }

      if (!isMounted) return

      const firstStudentId = data.students[0]?.id ?? ''
      setSelectedStudentId(firstStudentId)
      setSessionForm((current) => ({ ...current, studentId: firstStudentId }))
      const hasTrainerWorkspace = data.students.length > 0 || data.sessions.length > 0
      setAppMode(studentPortalSnapshot && !hasTrainerWorkspace ? 'student' : 'trainer')
      setLoading(false)
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [
    authReady,
    currentUser,
    trainerDataCurrent,
    trainerDataSnapshot,
    trainerDataReady,
    billingProfileSnapshot,
    billingProfileReady,
    studentPortalSnapshot,
    studentPortalReady,
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
  ])
}

type PersistenceDeps = {
  authReady: boolean
  currentUser: User | null
  doneSessions: string[]
  progressHistory: Record<string, ProgressHistoryEntry[]>
  trainerData: TrainerData
  billingProfile: BillingProfile
  exerciseVideoMap: Record<string, ExerciseVideoAttachment>
  syncMessage: string
  authMessage: string
  setSyncMessage: Dispatch<SetStateAction<string>>
  setAuthMessage: Dispatch<SetStateAction<string>>
}

export const usePersistenceEffects = ({
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
}: PersistenceDeps) => {
  useEffect(() => {
    if (!authReady) return
    if (hasSupabaseCredentials && !currentUser) return
    const userId = hasSupabaseCredentials ? currentUser?.id : undefined
    persistDoneSessions(doneSessions, userId)
  }, [authReady, currentUser, doneSessions])

  useEffect(() => {
    if (!authReady) return
    if (hasSupabaseCredentials && !currentUser) return
    const userId = hasSupabaseCredentials ? currentUser?.id : undefined
    persistProgressHistory(progressHistory, userId)
  }, [authReady, currentUser, progressHistory])

  useEffect(() => {
    if (!authReady) return
    if (hasSupabaseCredentials && !currentUser) return
    const userId = hasSupabaseCredentials ? currentUser?.id : undefined
    persistLocalTrainerData(trainerData, userId)
  }, [authReady, currentUser, trainerData])

  useEffect(() => {
    if (!authReady) return
    if (hasSupabaseCredentials && !currentUser) return
    const userId = hasSupabaseCredentials ? currentUser?.id : undefined
    persistLocalBillingProfile(billingProfile, userId)
  }, [authReady, currentUser, billingProfile])

  useEffect(() => {
    window.localStorage.setItem(EXERCISE_VIDEO_MAP_STORAGE_KEY, JSON.stringify(exerciseVideoMap))
  }, [exerciseVideoMap])

  useEffect(() => {
    if (!syncMessage && !authMessage) return
    const timeoutId = window.setTimeout(() => {
      setSyncMessage('')
      setAuthMessage('')
    }, 3500)
    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [syncMessage, authMessage, setSyncMessage, setAuthMessage])
}

type OfflineSyncDeps = {
  authReady: boolean
  currentUser: User | null
  setSyncMessage: Dispatch<SetStateAction<string>>
}

export const useOfflineSyncQueueEffect = ({
  authReady,
  currentUser,
  setSyncMessage,
}: OfflineSyncDeps) => {
  useEffect(() => {
    if (!authReady || !hasSupabaseCredentials || !currentUser) return
    let cancelled = false
    let running = false

    const runFlush = async () => {
      if (running || cancelled) return
      running = true
      const result = await flushSyncQueue(currentUser.id)
      running = false
      if (cancelled) return

      if (result.processed === 0 && result.skipped === 0 && result.failed === 0) {
        return
      }

      const parts = [
        result.processed > 0 ? `${result.processed} sincronizadas` : null,
        result.skipped > 0 ? `${result.skipped} descartadas por conflito` : null,
        result.failed > 0 ? `${result.failed} ainda pendentes` : null,
      ].filter(Boolean)
      if (parts.length > 0) {
        setSyncMessage(`Fila offline: ${parts.join(' • ')}`)
      }
    }

    void runFlush()

    const handleOnline = () => {
      void runFlush()
    }

    const intervalId = window.setInterval(() => {
      if (getSyncQueueCount(currentUser.id) === 0) return
      void runFlush()
    }, 30000)

    window.addEventListener('online', handleOnline)
    return () => {
      cancelled = true
      window.removeEventListener('online', handleOnline)
      window.clearInterval(intervalId)
    }
  }, [authReady, currentUser, setSyncMessage])
}

type PendingClaimDeps = {
  currentUser: User | null
  pendingClaimCode: string
  pendingClaimLoading: boolean
  syncClaimStudentAccessRemote: (
    inputCode: string,
  ) => Promise<{ ok: boolean; message: string; portal: StudentPortalData | null }>
  setPendingClaimLoading: Dispatch<SetStateAction<boolean>>
  setAuthMessage: Dispatch<SetStateAction<string>>
  setPendingClaimCode: Dispatch<SetStateAction<string>>
  setAuthStudentCode: Dispatch<SetStateAction<string>>
  setStudentPortal: Dispatch<SetStateAction<StudentPortalData | null>>
  setAppMode: Dispatch<SetStateAction<AppMode>>
  setSyncMessage: Dispatch<SetStateAction<string>>
}

export const usePendingClaimEffect = ({
  currentUser,
  pendingClaimCode,
  pendingClaimLoading,
  syncClaimStudentAccessRemote,
  setPendingClaimLoading,
  setAuthMessage,
  setPendingClaimCode,
  setAuthStudentCode,
  setStudentPortal,
  setAppMode,
  setSyncMessage,
}: PendingClaimDeps) => {
  useEffect(() => {
    if (!hasSupabaseCredentials || !currentUser || !pendingClaimCode || pendingClaimLoading) return
    let isMounted = true

    const runClaim = async () => {
      setPendingClaimLoading(true)
      const claim = await syncClaimStudentAccessRemote(pendingClaimCode)
      if (!isMounted) return

      if (!claim.ok) {
        setAuthMessage(claim.message)
        setPendingClaimCode('')
        setPendingClaimLoading(false)
        return
      }

      if (claim.portal) {
        setStudentPortal(claim.portal)
        setAppMode('student')
      }

      setAuthStudentCode('')
      setPendingClaimCode('')
      setPendingClaimLoading(false)
      setSyncMessage('Acesso de aluno vinculado com sucesso.')
    }

    runClaim()
    return () => {
      isMounted = false
    }
  }, [
    currentUser,
    pendingClaimCode,
    pendingClaimLoading,
    syncClaimStudentAccessRemote,
    setPendingClaimLoading,
    setAuthMessage,
    setPendingClaimCode,
    setAuthStudentCode,
    setStudentPortal,
    setAppMode,
    setSyncMessage,
  ])
}

type WorkoutDraftSyncDeps = {
  selectedStudentId: string
  workoutByStudent: WorkoutByStudent
  setWorkoutDraft: Dispatch<SetStateAction<WorkoutDraftItem[]>>
  setDemoExercise: Dispatch<SetStateAction<LibraryExercise | null>>
  setEditingDraftExerciseId: Dispatch<SetStateAction<string | null>>
}

export const useWorkoutDraftSyncEffect = ({
  selectedStudentId,
  workoutByStudent,
  setWorkoutDraft,
  setDemoExercise,
  setEditingDraftExerciseId,
}: WorkoutDraftSyncDeps) => {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!selectedStudentId) {
        setWorkoutDraft([])
        setDemoExercise(null)
        setEditingDraftExerciseId(null)
        return
      }

      const nextWorkout = workoutByStudent[selectedStudentId] ?? []
      const nextDraft = workoutToDraft(selectedStudentId, nextWorkout)
      setWorkoutDraft(nextDraft)
      setEditingDraftExerciseId(nextDraft[0]?.id ?? null)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [selectedStudentId, workoutByStudent, setWorkoutDraft, setDemoExercise, setEditingDraftExerciseId])
}

type TimerDeps = {
  restTimerRunning: boolean
  restTimerDone: boolean
  setRestTimerRemainingSeconds: Dispatch<SetStateAction<number>>
  setRestTimerRunning: Dispatch<SetStateAction<boolean>>
  setRestTimerDone: Dispatch<SetStateAction<boolean>>
}

export const useRestTimerEffects = ({
  restTimerRunning,
  restTimerDone,
  setRestTimerRemainingSeconds,
  setRestTimerRunning,
  setRestTimerDone,
}: TimerDeps) => {
  useEffect(() => {
    if (!restTimerRunning) return

    const intervalId = window.setInterval(() => {
      setRestTimerRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId)
          setRestTimerRunning(false)
          setRestTimerDone(true)
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [restTimerRunning, setRestTimerRemainingSeconds, setRestTimerRunning, setRestTimerDone])

  useEffect(() => {
    if (!restTimerDone) return
    const timeoutId = window.setTimeout(() => {
      setRestTimerDone(false)
    }, 2400)
    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [restTimerDone, setRestTimerDone])
}
