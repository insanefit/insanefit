import type { Dispatch, FormEvent, SetStateAction } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Exercise, Session, Student, StudentPortalData, TrainerData } from '../../types/trainer'
import type { ProgressHistoryEntry } from '../../types/workout'
import type { SessionFormState, StudentFormState } from '../appContextStore'
import {
  deleteStudentRemotely,
  saveSessionRemotely,
  updateSessionRemotely,
  unlinkStudentAccessRemotely,
} from '../../services/trainerStore'
import { enqueueSyncOperation } from '../../services/offlineSyncQueue'
import { canCreateStudent } from '../../services/billingStore'
import { sessionFormSchema, studentFormSchema } from '../../schemas/formSchemas'
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
  setDoneSessions: Dispatch<SetStateAction<string[]>>
  setProgressHistory: Dispatch<SetStateAction<Record<string, ProgressHistoryEntry[]>>>
  setSelectedStudentId: Dispatch<SetStateAction<string>>
  setEditingStudent: Dispatch<SetStateAction<boolean>>
  setSessionForm: Dispatch<SetStateAction<SessionFormState>>
  setEditingSessionId: Dispatch<SetStateAction<string | null>>
  setStudentForm: Dispatch<SetStateAction<StudentFormState>>
  setStudentEditForm: Dispatch<SetStateAction<StudentFormState>>
  setStudentPortal: Dispatch<SetStateAction<StudentPortalData | null>>
  setAppMode: Dispatch<SetStateAction<AppMode>>
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
    setDoneSessions,
    setProgressHistory,
    setSelectedStudentId,
    setEditingStudent,
    setSessionForm,
    setEditingSessionId,
    setStudentForm,
    setStudentEditForm,
    setStudentPortal,
    setAppMode,
  } = deps

  const normalizeWhatsapp = (value: string): string => {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    return digits.startsWith('55') ? digits : `55${digits}`
  }

  const generateShareCode = (): string => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let index = 0; index < 8; index += 1) {
      const randomIndex = Math.floor(Math.random() * alphabet.length)
      code += alphabet[randomIndex]
    }
    return code
  }

  const parseValidityDays = (value: string): number => {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return 30
    return Math.max(1, Math.min(3650, Math.round(parsed)))
  }

  const addDaysIsoDate = (baseDate: Date, days: number): string => {
    const nextDate = new Date(baseDate)
    nextDate.setDate(nextDate.getDate() + days)
    return nextDate.toISOString().slice(0, 10)
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
    const validityDays = parseValidityDays(studentForm.validityDays)
    const accessStartDate = new Date().toISOString().slice(0, 10)
    const accessEndDate = addDaysIsoDate(new Date(), validityDays)
    const studentValidation = studentFormSchema.safeParse({
      name,
      sex,
      trainingLevel,
      workoutType,
      whatsapp,
      validityDays,
    })
    if (!studentValidation.success) {
      setSyncMessage(studentValidation.error.issues[0]?.message ?? 'Dados do aluno invalidos.')
      return
    }

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
      accessStartDate,
      accessEndDate,
      shareCode: generateShareCode(),
      studentUserId: null,
      updatedAt: new Date().toISOString(),
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

    if (savedStudent) {
      setTrainerData((current) => ({
        ...current,
        students: current.students.map((student) =>
          student.id === newStudent.id
            ? {
                ...student,
                shareCode: savedStudent.shareCode ?? student.shareCode,
                studentUserId: savedStudent.studentUserId ?? null,
                updatedAt: savedStudent.updatedAt ?? student.updatedAt,
              }
            : student,
        ),
      }))
    }

    if ((!savedStudent || !exercisesSaved) && currentUser) {
      const pending = enqueueSyncOperation({
        type: 'student.create',
        userId: currentUser.id,
        student: newStudent,
        starterExercises,
        localUpdatedAt: newStudent.updatedAt,
      })
      setSyncMessage(`Aluno salvo localmente. ${pending} sincronizacao(oes) pendente(s).`)
      return
    }

    if (savedStudent && exercisesSaved) {
      setSyncMessage('Aluno salvo no Supabase com validade ativa.')
      return
    }
    setSyncMessage('Aluno salvo localmente. Confira as tabelas no Supabase.')
  }

  const handleStartStudentEdit = () => {
    if (!selectedStudent) return
    setStudentEditForm(buildStudentFormFromStudent(selectedStudent))
    setEditingStudent(true)
  }

  const handleDeleteStudent = async () => {
    if (!selectedStudent) {
      setSyncMessage('Selecione um aluno para excluir.')
      return
    }

    const shouldDelete = window.confirm(
      `Excluir o aluno ${selectedStudent.name}? Essa ação remove agenda e treinos desse aluno.`,
    )
    if (!shouldDelete) return

    const targetStudentId = selectedStudent.id
    const nextSelectedStudentId = students.find((student) => student.id !== targetStudentId)?.id ?? ''
    const relatedSessionIds = sessions
      .filter((session) => session.studentId === targetStudentId)
      .map((session) => session.id)

    if (hasSupabaseCredentials) {
      if (!currentUser) {
        setSyncMessage('Faca login para excluir aluno no Supabase.')
        return
      }
      const deleted = await deleteStudentRemotely(targetStudentId, currentUser.id)
      if (!deleted) {
        setSyncMessage('Nao foi possivel excluir no Supabase agora.')
        return
      }
    }

    setTrainerData((current) => {
      const nextStudents = current.students.filter((student) => student.id !== targetStudentId)
      const nextSessions = current.sessions.filter((session) => session.studentId !== targetStudentId)
      const nextWorkoutByStudent = { ...current.workoutByStudent }
      delete nextWorkoutByStudent[targetStudentId]
      return {
        ...current,
        students: nextStudents,
        sessions: nextSessions,
        workoutByStudent: nextWorkoutByStudent,
      }
    })

    setDoneSessions((current) => current.filter((sessionId) => !relatedSessionIds.includes(sessionId)))
    setProgressHistory((current) => {
      const next = { ...current }
      delete next[targetStudentId]
      return next
    })
    setSelectedStudentId((current) => (current === targetStudentId ? nextSelectedStudentId : current))
    setSessionForm((current) => ({
      ...current,
      studentId: current.studentId === targetStudentId ? nextSelectedStudentId : current.studentId,
    }))
    setStudentPortal((current) => (current?.student.id === targetStudentId ? null : current))
    if (studentPortal?.student.id === targetStudentId) {
      setAppMode('trainer')
    }
    setEditingStudent(false)
    setSyncMessage(
      hasSupabaseCredentials
        ? 'Aluno excluido com sucesso no Supabase.'
        : 'Aluno excluido no modo local.',
    )
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
    const validityDays = parseValidityDays(studentEditForm.validityDays)
    const accessStartDate = selectedStudent.accessStartDate ?? new Date().toISOString().slice(0, 10)
    const accessEndDate = addDaysIsoDate(new Date(accessStartDate), validityDays)
    const studentValidation = studentFormSchema.safeParse({
      name,
      sex,
      trainingLevel,
      workoutType,
      whatsapp,
      validityDays,
    })
    if (!studentValidation.success) {
      setSyncMessage(studentValidation.error.issues[0]?.message ?? 'Dados do aluno invalidos.')
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
      accessStartDate,
      accessEndDate,
      updatedAt: new Date().toISOString(),
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

    if (saved) {
      setSyncMessage('Aluno atualizado com nova validade de acesso.')
      return
    }
    const pending = enqueueSyncOperation({
      type: 'student.update',
      userId: currentUser.id,
      student: updatedStudent,
      localUpdatedAt: updatedStudent.updatedAt,
    })
    setSyncMessage(`Aluno atualizado localmente. ${pending} sincronizacao(oes) pendente(s).`)
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
    const parsedDuration = Number(sessionForm.duration) || 60
    const sessionValidation = sessionFormSchema.safeParse({
      studentId: sessionForm.studentId,
      day: sessionForm.day,
      time: sessionForm.time,
      focus: sessionForm.focus,
      duration: parsedDuration,
    })
    if (!sessionValidation.success) {
      setSyncMessage(sessionValidation.error.issues[0]?.message ?? 'Dados da aula invalidos.')
      return
    }

    const baseSession: Session = {
      id: editingSessionId ?? createId('a'),
      day: sessionForm.day,
      time: sessionForm.time,
      studentId: sessionForm.studentId,
      focus: sessionForm.focus.trim(),
      duration: parsedDuration,
      updatedAt: new Date().toISOString(),
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
    if (!saved) {
      const pending = enqueueSyncOperation({
        type: editingSessionId ? 'session.update' : 'session.create',
        userId: currentUser.id,
        session: baseSession,
        localUpdatedAt: baseSession.updatedAt,
      })
      setSyncMessage(
        editingSessionId
          ? `Aula atualizada localmente. ${pending} sincronizacao(oes) pendente(s).`
          : `Aula salva localmente. ${pending} sincronizacao(oes) pendente(s).`,
      )
      return
    }
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
    const shareText = `Oi ${student.name}, aqui esta seu acesso ao Insane Fit: ${accessLink}`
    try {
      const normalizedWhatsapp = normalizeWhatsapp(student.whatsapp?.trim() ?? '')
      if (normalizedWhatsapp) {
        const whatsappUrl = `https://wa.me/${normalizedWhatsapp}?text=${encodeURIComponent(shareText)}`
        const popup = window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
        if (popup) {
          setSyncMessage(`Link de acesso aberto no WhatsApp de ${student.name}.`)
          return
        }
      }
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
    handleDeleteStudent,
  }
}
