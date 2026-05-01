import type { Dispatch, FormEvent, SetStateAction } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Exercise, Session, Student, StudentPortalData, TrainerData } from '../../types/trainer'
import type { SessionFormState, StudentFormState } from '../appContextStore'
import {
  saveSessionRemotely,
  updateSessionRemotely,
  unlinkStudentAccessRemotely,
} from '../../services/trainerStore'
import { canCreateStudent } from '../../services/billingStore'
import {
  buildCurrentMonthRef,
  saveTrainerPixKeyRemotely,
  upsertTrainerStudentPayment,
} from '../../services/paymentStore'
import type { BillingProfile } from '../../types/billing'
import { getPlanDefinition } from '../../data/plans'

type AppMode = 'trainer' | 'student'

type StudentHandlerDeps = {
  billingProfile: BillingProfile
  activePlanName: string
  students: Student[]
  selectedStudent: Student | null
  studentForm: StudentFormState
  studentEditForm: StudentFormState
  sessionForm: SessionFormState
  editingSessionId: string | null
  sessions: Session[]
  currentUser: User | null
  hasSupabaseCredentials: boolean
  studentPortal: StudentPortalData | null
  defaultStudentForm: StudentFormState
  buildStudentFormFromStudent: (student: Student) => StudentFormState
  createId: (prefix: string) => string
  syncCreateStudentRemote: (input: {
    student: Student
    starterExercises: Exercise[]
    userId: string
  }) => Promise<{ savedStudent: Student | null; exercisesSaved: boolean }>
  syncUpdateStudentRemote: (input: { student: Student; userId: string }) => Promise<boolean>
  setSyncMessage: Dispatch<SetStateAction<string>>
  setTrainerData: Dispatch<SetStateAction<TrainerData>>
  setSelectedStudentId: Dispatch<SetStateAction<string>>
  setEditingStudent: Dispatch<SetStateAction<boolean>>
  setSessionForm: Dispatch<SetStateAction<SessionFormState>>
  setEditingSessionId: Dispatch<SetStateAction<string | null>>
  setStudentForm: Dispatch<SetStateAction<StudentFormState>>
  setStudentEditForm: Dispatch<SetStateAction<StudentFormState>>
  setStudentPortal: Dispatch<SetStateAction<StudentPortalData | null>>
  setAppMode: Dispatch<SetStateAction<AppMode>>
  invalidateFinanceCache: () => Promise<void> | void
}

export const createStudentHandlers = (deps: StudentHandlerDeps) => {
  const {
    billingProfile,
    activePlanName,
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
    syncCreateStudentRemote,
    syncUpdateStudentRemote,
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
  } = deps

  const normalizeWhatsapp = (value: string): string => {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    return digits.startsWith('55') ? digits : `55${digits}`
  }

  const parseMonthlyFee = (value: string): number => {
    const trimmed = value.trim().replace(/[^\d,.-]/g, '')
    if (!trimmed) return 0
    const normalized =
      trimmed.includes(',') && trimmed.includes('.')
        ? trimmed.replace(/\./g, '').replace(',', '.')
        : trimmed.replace(',', '.')
    const parsed = Number(normalized)
    if (!Number.isFinite(parsed)) return 0
    return Math.max(0, parsed)
  }

  const parseDueDay = (value: string): number => {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return 10
    return Math.max(1, Math.min(31, Math.round(parsed)))
  }

  const handleCreateStudent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canCreateStudent(billingProfile.plan, students.length)) {
      const limit = getPlanDefinition(billingProfile.plan).studentLimit
      setSyncMessage(`Plano ${activePlanName} permite ate ${limit ?? 'N'} alunos. Faça upgrade para continuar.`)
      return
    }

    const name = studentForm.name.trim()
    const sex = studentForm.sex.trim()
    const trainingLevel = studentForm.trainingLevel.trim()
    const workoutType = studentForm.workoutType.trim()
    const whatsapp = normalizeWhatsapp(studentForm.whatsapp.trim())
    const monthlyFee = parseMonthlyFee(studentForm.monthlyFee)
    const dueDay = parseDueDay(studentForm.dueDay)
    const pixKey = studentForm.pixKey.trim()
    if (!name || !sex || !trainingLevel || !workoutType) return

    const newStudent: Student = {
      id: createId('s'),
      name,
      objective: workoutType,
      adherence: 75,
      streak: 0,
      nextSession: sex,
      plan: trainingLevel,
      sex,
      trainingLevel,
      workoutType,
      whatsapp: whatsapp || undefined,
      monthlyFee,
      dueDay,
      pixKey: pixKey || undefined,
      studentUserId: null,
    }

    const starterExercises: Exercise[] = [
      {
        name: 'Treino inicial',
        sets: '2 x 10-12',
        note: 'Warm: 40%x15, 60%x10 | Feeder: 1x8 @ RPE 6 | Work: 2x10-12 @ RPE 8 | Rest: 75s | Obs: Ajustar carga apos primeira avaliacao',
      },
      {
        name: 'Mobilidade geral',
        sets: '2 x 8 min',
        note: 'Warm: Mobilidade ativa 5min | Feeder: 1x4 min @ RPE 5 | Work: 2x8 min @ RPE 6 | Rest: 45s | Obs: Inicio da sessao',
      },
    ]

    setTrainerData((current) => ({
      ...current,
      students: [...current.students, newStudent],
      workoutByStudent: { ...current.workoutByStudent, [newStudent.id]: starterExercises },
    }))

    setSelectedStudentId(newStudent.id)
    setEditingStudent(false)
    setSessionForm((current) => ({ ...current, studentId: newStudent.id }))
    setStudentForm(defaultStudentForm)

    if (!hasSupabaseCredentials) {
      setSyncMessage('Aluno salvo no modo local')
      return
    }
    if (!currentUser) {
      setSyncMessage('Faca login para salvar aluno no Supabase.')
      return
    }

    const { savedStudent, exercisesSaved } = await syncCreateStudentRemote({
      student: newStudent,
      starterExercises,
      userId: currentUser.id,
    })

    let paymentSynced = false
    if (savedStudent) {
      const monthRef = buildCurrentMonthRef()
      if (pixKey) {
        await saveTrainerPixKeyRemotely({
          userId: currentUser.id,
          pixKey,
        })
      }
      const paymentResult = await upsertTrainerStudentPayment({
        userId: currentUser.id,
        studentId: newStudent.id,
        monthRef,
        monthlyFee,
        dueDay,
        pixKey,
        markAsPaid: false,
      })
      paymentSynced = paymentResult.ok
    }

    if (savedStudent) {
      setTrainerData((current) => ({
        ...current,
        students: current.students.map((student) =>
          student.id === newStudent.id
            ? { ...student, shareCode: savedStudent.shareCode, studentUserId: savedStudent.studentUserId ?? null }
            : student,
        ),
      }))
    }

    void invalidateFinanceCache()

    if (savedStudent && exercisesSaved && paymentSynced) {
      setSyncMessage('Aluno salvo com financeiro sincronizado no Supabase.')
      return
    }
    if (savedStudent && exercisesSaved) {
      setSyncMessage('Aluno salvo no Supabase. Financeiro salvo parcialmente.')
      return
    }
    setSyncMessage('Aluno salvo localmente. Confira as tabelas no Supabase.')
  }

  const handleStartStudentEdit = () => {
    if (!selectedStudent) return
    setStudentEditForm(buildStudentFormFromStudent(selectedStudent))
    setEditingStudent(true)
  }

  const handleCancelStudentEdit = () => {
    setEditingStudent(false)
    if (selectedStudent) {
      setStudentEditForm(buildStudentFormFromStudent(selectedStudent))
    } else {
      setStudentEditForm(defaultStudentForm)
    }
  }

  const handleUpdateStudent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedStudent) {
      setSyncMessage('Selecione um aluno para editar.')
      return
    }

    const name = studentEditForm.name.trim()
    const sex = studentEditForm.sex.trim()
    const trainingLevel = studentEditForm.trainingLevel.trim()
    const workoutType = studentEditForm.workoutType.trim()
    const whatsapp = normalizeWhatsapp(studentEditForm.whatsapp.trim())
    const monthlyFee = parseMonthlyFee(studentEditForm.monthlyFee)
    const dueDay = parseDueDay(studentEditForm.dueDay)
    const pixKey = studentEditForm.pixKey.trim()
    if (!name || !sex || !trainingLevel || !workoutType) {
      setSyncMessage('Preencha nome, sexo, nivel e tipo de treino.')
      return
    }

    const updatedStudent: Student = {
      ...selectedStudent,
      name,
      objective: workoutType,
      nextSession: sex,
      plan: trainingLevel,
      sex,
      trainingLevel,
      workoutType,
      whatsapp: whatsapp || undefined,
      monthlyFee,
      dueDay,
      pixKey: pixKey || undefined,
    }

    setTrainerData((current) => ({
      ...current,
      students: current.students.map((student) =>
        student.id === updatedStudent.id ? updatedStudent : student,
      ),
    }))
    setStudentPortal((current) =>
      current && current.student.id === updatedStudent.id ? { ...current, student: updatedStudent } : current,
    )
    setEditingStudent(false)

    if (!hasSupabaseCredentials) {
      setSyncMessage('Aluno atualizado no modo local.')
      return
    }
    if (!currentUser) {
      setSyncMessage('Faca login para sincronizar a edicao do aluno.')
      return
    }

    const saved = await syncUpdateStudentRemote({ student: updatedStudent, userId: currentUser.id })

    let pixSynced = true
    if (pixKey) {
      const pixResult = await saveTrainerPixKeyRemotely({
        userId: currentUser.id,
        pixKey,
      })
      pixSynced = pixResult.ok
    }

    const paymentResult = await upsertTrainerStudentPayment({
      userId: currentUser.id,
      studentId: updatedStudent.id,
      monthRef: buildCurrentMonthRef(),
      monthlyFee,
      dueDay,
      pixKey,
      markAsPaid: false,
    })

    void invalidateFinanceCache()

    if (saved && paymentResult.ok && pixSynced) {
      setSyncMessage('Aluno atualizado com financeiro sincronizado.')
      return
    }
    if (saved) {
      setSyncMessage('Aluno atualizado. Revise o financeiro no painel.')
      return
    }
    setSyncMessage('Aluno atualizado localmente. Verifique o Supabase.')
  }

  const resetSessionForm = () => {
    setSessionForm((current) => ({ ...current, focus: '', duration: 60 }))
    setEditingSessionId(null)
  }

  const handleStartSessionEdit = (sessionId: string) => {
    const targetSession = sessions.find((session) => session.id === sessionId)
    if (!targetSession) return

    setSessionForm({
      studentId: targetSession.studentId,
      day: targetSession.day,
      time: targetSession.time,
      focus: targetSession.focus,
      duration: targetSession.duration,
    })
    setEditingSessionId(sessionId)
    setSyncMessage('Modo de edição da aula ativado.')
  }

  const handleCancelSessionEdit = () => {
    resetSessionForm()
    setSyncMessage('Edição da aula cancelada.')
  }

  const handleCreateSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!sessionForm.studentId || !sessionForm.focus.trim()) return

    const baseSession: Session = {
      id: editingSessionId ?? createId('a'),
      day: sessionForm.day,
      time: sessionForm.time,
      studentId: sessionForm.studentId,
      focus: sessionForm.focus.trim(),
      duration: Number(sessionForm.duration) || 60,
    }

    if (editingSessionId) {
      setTrainerData((current) => ({
        ...current,
        sessions: current.sessions.map((session) =>
          session.id === editingSessionId ? baseSession : session,
        ),
      }))
    } else {
      setTrainerData((current) => ({ ...current, sessions: [...current.sessions, baseSession] }))
    }
    resetSessionForm()

    if (!hasSupabaseCredentials) {
      setSyncMessage(editingSessionId ? 'Aula atualizada no modo local.' : 'Aula salva no modo local')
      return
    }
    if (!currentUser) {
      setSyncMessage('Faca login para salvar/editar aula no Supabase.')
      return
    }

    const saved = editingSessionId
      ? await updateSessionRemotely(baseSession, currentUser.id)
      : await saveSessionRemotely(baseSession, currentUser.id)
    setSyncMessage(
      saved
        ? editingSessionId
          ? 'Aula atualizada e sincronizada no Supabase.'
          : 'Aula salva e sincronizada no Supabase.'
        : editingSessionId
          ? 'Aula atualizada localmente. Confira as tabelas no Supabase.'
          : 'Aula salva localmente. Confira as tabelas no Supabase.',
    )
  }

  const handleCopyStudentCode = async (shareCode?: string) => {
    if (!shareCode) {
      setSyncMessage('Esse aluno ainda nao tem codigo de acesso.')
      return
    }
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareCode)
        setSyncMessage('Codigo copiado para a area de transferencia.')
        return
      }
      setSyncMessage(`Copie manualmente o codigo: ${shareCode}`)
    } catch {
      setSyncMessage(`Nao foi possivel copiar automaticamente. Codigo: ${shareCode}`)
    }
  }

  const handleShareStudentAccessLink = async (student: Student) => {
    const shareCode = student.shareCode?.trim()
    if (!shareCode) {
      setSyncMessage('Esse aluno ainda nao tem codigo de acesso para compartilhar.')
      return
    }
    const accessLink = `${window.location.origin}/?codigo=${encodeURIComponent(shareCode)}`
    const shareText = `Acesso Insane Fit para ${student.name}: ${accessLink}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Acesso Insane Fit',
          text: `Oi ${student.name}, use este link para criar sua conta.`,
          url: accessLink,
        })
        setSyncMessage('Link de acesso enviado.')
        return
      }
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareText)
        setSyncMessage('Link de acesso copiado para enviar ao aluno.')
        return
      }
      setSyncMessage(`Copie e envie ao aluno: ${shareText}`)
    } catch {
      setSyncMessage(`Copie e envie ao aluno: ${shareText}`)
    }
  }

  const handleUnlinkStudentAccess = async (studentId: string) => {
    const targetStudent = students.find((student) => student.id === studentId)
    if (!targetStudent || !targetStudent.studentUserId) {
      setSyncMessage('Esse aluno nao esta vinculado a nenhuma conta.')
      return
    }
    const shouldUnlink = window.confirm(`Desvincular o acesso do aluno ${targetStudent.name}?`)
    if (!shouldUnlink) return

    if (hasSupabaseCredentials) {
      if (!currentUser) {
        setSyncMessage('Faca login para desvincular no Supabase.')
        return
      }
      const saved = await unlinkStudentAccessRemotely(studentId, currentUser.id)
      if (!saved) {
        setSyncMessage('Nao foi possivel desvincular no Supabase agora.')
        return
      }
    }

    setTrainerData((current) => ({
      ...current,
      students: current.students.map((student) =>
        student.id === studentId ? { ...student, studentUserId: null } : student,
      ),
    }))

    if (studentPortal?.student.id === studentId) {
      setStudentPortal(null)
      setAppMode('trainer')
    }

    setSyncMessage('Acesso do aluno desvinculado com sucesso.')
  }

  return {
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
  }
}
