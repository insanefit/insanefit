import type { FormEvent, Dispatch, SetStateAction } from 'react'
import type { User } from '@supabase/supabase-js'
import type { StudentPortalData } from '../../types/trainer'
import {
  resendSignupConfirmation,
  sendPasswordReset,
  signIn,
  signOut,
  signUp,
  updateUserPassword,
} from '../../services/trainerStore'

type AuthMode = 'login' | 'signup'
type AppMode = 'trainer' | 'student'

type AuthForm = { email: string; password: string }
type RecoveryForm = { password: string; confirmPassword: string }

type AuthHandlerDeps = {
  hasSupabaseCredentials: boolean
  authForm: AuthForm
  authStudentCode: string
  authMode: AuthMode
  recoveryForm: RecoveryForm
  currentUser: User | null
  studentAccessCode: string
  setAuthMessage: Dispatch<SetStateAction<string>>
  setAuthLoading: Dispatch<SetStateAction<boolean>>
  setLoading: Dispatch<SetStateAction<boolean>>
  setAuthForm: Dispatch<SetStateAction<AuthForm>>
  setLocalAccessGranted: Dispatch<SetStateAction<boolean>>
  setPendingClaimCode: Dispatch<SetStateAction<string>>
  setRecoveryLoading: Dispatch<SetStateAction<boolean>>
  setRecoveryMessage: Dispatch<SetStateAction<string>>
  setRecoveryForm: Dispatch<SetStateAction<RecoveryForm>>
  setPasswordRecoveryMode: Dispatch<SetStateAction<boolean>>
  setSyncMessage: Dispatch<SetStateAction<string>>
  setLinkingStudent: Dispatch<SetStateAction<boolean>>
  setStudentPortal: Dispatch<SetStateAction<StudentPortalData | null>>
  setAppMode: Dispatch<SetStateAction<AppMode>>
  setStudentAccessCode: Dispatch<SetStateAction<string>>
  syncClaimStudentAccessRemote: (
    inputCode: string,
  ) => Promise<{ ok: boolean; message: string; portal: StudentPortalData | null }>
  clearRecoveryUrlArtifacts: () => void
}

export const createAuthHandlers = (deps: AuthHandlerDeps) => {
  const {
    hasSupabaseCredentials,
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
    setLocalAccessGranted,
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
    syncClaimStudentAccessRemote,
    clearRecoveryUrlArtifacts,
  } = deps

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const email = authForm.email.trim().toLowerCase()
    const password = authForm.password.trim()
    const studentCode = authStudentCode.trim().toUpperCase()

    if (!email || !password) {
      setAuthMessage('Preencha email e senha.')
      return
    }
    if (password.length < 6) {
      setAuthMessage('Senha deve ter pelo menos 6 caracteres.')
      return
    }

    setAuthLoading(true)
    setLoading(true)
    const result = authMode === 'login' ? await signIn(email, password) : await signUp(email, password)
    setAuthLoading(false)
    setAuthMessage(result.message)
    setLoading(false)

    if (result.ok) {
      setLocalAccessGranted(true)
      setAuthForm((current) => ({ ...current, email, password: '' }))
      if (studentCode) {
        setPendingClaimCode(studentCode)
      }
    }
  }

  const handleResendConfirmation = async () => {
    const email = authForm.email.trim().toLowerCase()
    if (!email) {
      setAuthMessage('Informe o email para reenviar a confirmacao.')
      return
    }
    setAuthLoading(true)
    const result = await resendSignupConfirmation(email)
    setAuthLoading(false)
    setAuthMessage(result.message)
  }

  const handlePasswordReset = async () => {
    const email = authForm.email.trim().toLowerCase()
    if (!email) {
      setAuthMessage('Informe o email para receber o link de recuperacao.')
      return
    }
    setAuthLoading(true)
    const result = await sendPasswordReset(email)
    setAuthLoading(false)
    setAuthMessage(result.message)
  }

  const handleCompletePasswordRecovery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const password = recoveryForm.password.trim()
    const confirmPassword = recoveryForm.confirmPassword.trim()

    if (!password || !confirmPassword) {
      setRecoveryMessage('Preencha e confirme a nova senha.')
      return
    }
    if (password.length < 6) {
      setRecoveryMessage('A nova senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setRecoveryMessage('As senhas nao conferem.')
      return
    }

    setRecoveryLoading(true)
    const result = await updateUserPassword(password)
    setRecoveryLoading(false)
    setRecoveryMessage(result.message)

    if (result.ok) {
      clearRecoveryUrlArtifacts()
      setRecoveryForm({ password: '', confirmPassword: '' })
      setPasswordRecoveryMode(false)
      await signOut()
      setAuthMessage('Senha atualizada. Entre com sua nova senha.')
    }
  }

  const handleCancelPasswordRecovery = () => {
    clearRecoveryUrlArtifacts()
    setPasswordRecoveryMode(false)
    setRecoveryForm({ password: '', confirmPassword: '' })
    setRecoveryMessage('')
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await signOut()
      if (!hasSupabaseCredentials) {
        setLocalAccessGranted(false)
        setStudentPortal(null)
        setAppMode('trainer')
      }
      setSyncMessage('Sessao encerrada.')
    } finally {
      setLoading(false)
    }
  }

  const handleClaimStudentAccess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentUser) {
      setSyncMessage('Faca login para vincular a conta de aluno.')
      return
    }

    setLinkingStudent(true)
    const claim = await syncClaimStudentAccessRemote(studentAccessCode)
    setLinkingStudent(false)

    if (!claim.ok) {
      setSyncMessage(claim.message)
      return
    }

    if (!claim.portal) {
      setSyncMessage('Conta vinculada, mas nao foi possivel abrir o portal agora.')
      return
    }

    setStudentPortal(claim.portal)
    setAppMode('student')
    setStudentAccessCode('')
    setSyncMessage(claim.message)
  }

  return {
    handleAuthSubmit,
    handleResendConfirmation,
    handlePasswordReset,
    handleCompletePasswordRecovery,
    handleCancelPasswordRecovery,
    handleSignOut,
    handleClaimStudentAccess,
  }
}
