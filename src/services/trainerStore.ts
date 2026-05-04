import type { AuthChangeEvent, Session as SupabaseSession, User } from '@supabase/supabase-js'
import { defaultTrainerData } from '../data/mockData'
import { hasSupabaseCredentials, supabase } from '../lib/supabase'
import type {
  Exercise,
  Session,
  Student,
  StudentPortalData,
  TrainerData,
  WorkoutByStudent,
} from '../types/trainer'
import { buildCurrentMonthRef } from './paymentStore'
import {
  exerciseRowSchema,
  parseRows,
  parseSingle,
  sessionRowSchema,
  studentPaymentSummaryRowSchema,
  studentPortalFinanceRowSchema,
  studentRowSchema,
  trainerProfilePixSchema,
} from '../schemas/supabaseSchemas'
import type { z } from 'zod'

const dataStorageKey = 'insanefit:data:v1'
const doneStorageKey = 'insanefit:done:v1'
const legacyDataStorageKey = 'pulsecoach:data:v1'
const legacyDoneStorageKey = 'pulsecoach:done:v1'
const studentMetaStorageKey = 'insanefit:student_meta:v1'

type StudentRow = z.infer<typeof studentRowSchema>
type SessionRow = z.infer<typeof sessionRowSchema>
type ExerciseRow = z.infer<typeof exerciseRowSchema>

type ExerciseVideoRow = {
  user_id: string
  exercise_key: string
  raw_url: string
  embed_url: string
  license_label: string | null
  notes: string | null
  updated_at: string
}

type ExerciseVideoAttachment = {
  rawUrl: string
  embedUrl: string
  licenseLabel: string
  notes: string
  updatedAt: string
}

type StudentPortalFinanceRow = z.infer<typeof studentPortalFinanceRowSchema>

type StudentMeta = {
  whatsapp?: string
}

const cloneDefaultData = (): TrainerData =>
  JSON.parse(JSON.stringify(defaultTrainerData)) as TrainerData

const scopedKey = (base: string, userId?: string): string =>
  userId ? `${base}:${userId}` : base

const readStorage = <T>(key: string): T | null => {
  try {
    const content = localStorage.getItem(key)
    return content ? (JSON.parse(content) as T) : null
  } catch {
    return null
  }
}

const writeStorage = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value))
}

const readStudentMetaMap = (userId?: string): Record<string, StudentMeta> =>
  readStorage<Record<string, StudentMeta>>(scopedKey(studentMetaStorageKey, userId)) ?? {}

const writeStudentMetaMap = (map: Record<string, StudentMeta>, userId?: string) => {
  writeStorage(scopedKey(studentMetaStorageKey, userId), map)
}

const persistStudentMeta = (studentId: string, meta: StudentMeta, userId?: string) => {
  const map = readStudentMetaMap(userId)
  if (!meta.whatsapp?.trim()) {
    delete map[studentId]
  } else {
    map[studentId] = { whatsapp: meta.whatsapp.trim() }
  }
  writeStudentMetaMap(map, userId)
}

const readScopedStorage = <T>(
  currentBase: string,
  legacyBase: string,
  userId?: string,
): T | null => {
  const currentKey = scopedKey(currentBase, userId)
  const currentValue = readStorage<T>(currentKey)
  if (currentValue) {
    return currentValue
  }

  const legacyKey = scopedKey(legacyBase, userId)
  const legacyValue = readStorage<T>(legacyKey)
  if (!legacyValue) {
    return null
  }

  writeStorage(currentKey, legacyValue)
  localStorage.removeItem(legacyKey)
  return legacyValue
}

const normalizeLookup = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const createShareCode = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let index = 0; index < 8; index += 1) {
    const randomIndex = Math.floor(Math.random() * alphabet.length)
    code += alphabet[randomIndex]
  }
  return code
}

const parseSexFromValue = (value: string): string | undefined => {
  const normalized = normalizeLookup(value)
  if (!normalized) {
    return undefined
  }

  if (normalized === 'masculino') {
    return 'Masculino'
  }

  if (normalized === 'feminino') {
    return 'Feminino'
  }

  if (normalized === 'outro') {
    return 'Outro'
  }

  return undefined
}

const parseTrainingLevelFromValue = (value: string): string | undefined => {
  const normalized = normalizeLookup(value)
  if (!normalized) {
    return undefined
  }

  if (normalized === 'iniciante') {
    return 'Iniciante'
  }

  if (normalized === 'intermediario') {
    return 'Intermediario'
  }

  if (normalized === 'avancado') {
    return 'Avancado'
  }

  return undefined
}

const pickString = (...values: Array<string | null | undefined>): string | undefined => {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return undefined
}

const mapStudentRow = (item: StudentRow, meta?: StudentMeta): Student => {
  const whatsappValue = pickString(item.whatsapp, meta?.whatsapp)
  const sexValue = pickString(item.sex, item.next_session)
  const trainingLevelValue = pickString(item.training_level, item.plan)
  const workoutTypeValue = pickString(item.workout_type, item.objective)
  return {
    id: item.id,
    name: item.name,
    objective: item.objective,
    adherence: item.adherence,
    streak: item.streak,
    nextSession: item.next_session,
    plan: item.plan,
    sex: parseSexFromValue(sexValue ?? ''),
    trainingLevel: parseTrainingLevelFromValue(trainingLevelValue ?? ''),
    workoutType: workoutTypeValue,
    whatsapp: whatsappValue || undefined,
    shareCode: item.share_code ?? undefined,
    studentUserId: item.student_user_id,
    updatedAt: item.updated_at ?? undefined,
  }
}

const mapSupabaseData = (
  studentsRaw: StudentRow[],
  sessionsRaw: SessionRow[],
  exercisesRaw: ExerciseRow[],
  studentMetaMap: Record<string, StudentMeta>,
  paymentByStudent: Record<string, { monthlyFee: number; dueDay: number }>,
  trainerPixKey: string,
): TrainerData => {
  const students: Student[] = studentsRaw.map((item) => {
    const baseStudent = mapStudentRow(item, studentMetaMap[item.id])
    const payment = paymentByStudent[item.id]
    return {
      ...baseStudent,
      monthlyFee: payment?.monthlyFee ?? 0,
      dueDay: payment?.dueDay ?? 10,
      pixKey: trainerPixKey || undefined,
    }
  })

  const sessions: Session[] = sessionsRaw.map((item) => ({
    id: item.id,
    day: item.day,
    time: item.time,
    studentId: item.student_id,
    focus: item.focus,
    duration: item.duration,
    updatedAt: item.updated_at ?? undefined,
  }))

  const workoutByStudent: WorkoutByStudent = {}

  exercisesRaw.forEach((item) => {
    if (!workoutByStudent[item.student_id]) {
      workoutByStudent[item.student_id] = []
    }

    workoutByStudent[item.student_id].push({
      name: item.name,
      sets: item.sets,
      note: item.note,
      day: item.day ?? undefined,
      routine: item.routine ?? undefined,
    })
  })

  return {
    students,
    sessions,
    workoutByStudent,
  }
}

const loadFromSupabase = async (userId: string): Promise<TrainerData | null> => {
  if (!supabase) {
    return null
  }

  const monthRef = buildCurrentMonthRef()
  const [studentsResponse, sessionsResponse, exercisesResponse, paymentsResponse, profileResponse] =
    await Promise.all([
    supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true }),
    supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('day', { ascending: true })
      .order('time', { ascending: true }),
    supabase
      .from('exercises')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('student_payments')
      .select('student_id,monthly_fee,due_day')
      .eq('user_id', userId)
      .eq('month_ref', monthRef),
    supabase
      .from('trainer_profiles')
      .select('pix_key')
      .eq('user_id', userId)
      .maybeSingle(),
    ])

  if (studentsResponse.error || sessionsResponse.error || exercisesResponse.error) {
    return null
  }

  const paymentRows = parseRows(
    studentPaymentSummaryRowSchema,
    paymentsResponse.error ? [] : (paymentsResponse.data ?? []),
  )
  const paymentByStudent = paymentRows.reduce<Record<string, { monthlyFee: number; dueDay: number }>>(
    (accumulator, row) => {
      accumulator[row.student_id] = {
        monthlyFee: Number(row.monthly_fee ?? 0),
        dueDay: Number(row.due_day ?? 10),
      }
      return accumulator
    },
    {},
  )
  const trainerPixProfile = parseSingle(trainerProfilePixSchema, profileResponse.error ? null : profileResponse.data)
  const trainerPixKey = trainerPixProfile?.pix_key?.trim() ?? ''

  return mapSupabaseData(
    parseRows(studentRowSchema, studentsResponse.data ?? []),
    parseRows(sessionRowSchema, sessionsResponse.data ?? []),
    parseRows(exerciseRowSchema, exercisesResponse.data ?? []),
    readStudentMetaMap(userId),
    paymentByStudent,
    trainerPixKey,
  )
}

export const loadTrainerData = async (userId?: string): Promise<TrainerData> => {
  if (hasSupabaseCredentials && userId) {
    const supabaseData = await loadFromSupabase(userId)
    // Em modo Supabase nunca cai para seed/demo local.
    // Isso evita aluno logado aparecer como "personal" por dados de fallback.
    return (
      supabaseData ?? {
        students: [],
        sessions: [],
        workoutByStudent: {},
      }
    )
  }

  if (hasSupabaseCredentials && !userId) {
    return {
      students: [],
      sessions: [],
      workoutByStudent: {},
    }
  }

  const localData = readScopedStorage<TrainerData>(dataStorageKey, legacyDataStorageKey, userId)
  if (localData) {
    return localData
  }

  const fallback = cloneDefaultData()
  writeStorage(scopedKey(dataStorageKey, userId), fallback)
  return fallback
}

export const persistLocalTrainerData = (data: TrainerData, userId?: string) => {
  writeStorage(scopedKey(dataStorageKey, userId), data)
}

export const loadDoneSessions = (userId?: string): string[] =>
  readScopedStorage<string[]>(doneStorageKey, legacyDoneStorageKey, userId) ?? []

export const persistDoneSessions = (doneSessions: string[], userId?: string) => {
  writeStorage(scopedKey(doneStorageKey, userId), doneSessions)
}

export const getCurrentUser = async (): Promise<User | null> => {
  if (!supabase) {
    return null
  }

  const { data } = await supabase.auth.getUser()
  return data.user ?? null
}

export const subscribeAuthState = (
  callback: (event: AuthChangeEvent, session: SupabaseSession | null) => void,
) => {
  if (!supabase) {
    return null
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback)

  return subscription
}

const mapSupabaseAuthMessage = (rawMessage: string): string => {
  const message = rawMessage.toLowerCase()

  if (message.includes('invalid login credentials')) {
    return 'Email ou senha invalidos. Confira os dados e tente novamente.'
  }

  if (message.includes('email not confirmed')) {
    return 'Email ainda nao confirmado. Use "Reenviar confirmacao" e valide sua caixa de entrada.'
  }

  if (message.includes('user already registered')) {
    return 'Esse email ja esta cadastrado. Tente entrar ou recuperar a senha.'
  }

  if (message.includes('password should be at least 6 characters')) {
    return 'A senha precisa ter pelo menos 6 caracteres.'
  }

  if (message.includes('unable to validate email address') || message.includes('invalid email')) {
    return 'Email invalido. Revise o endereco e tente novamente.'
  }

  if (message.includes('for security purposes') || message.includes('rate limit')) {
    return 'Muitas tentativas em pouco tempo. Aguarde um minuto e tente novamente.'
  }

  return rawMessage
}

export const signIn = async (email: string, password: string): Promise<{ ok: boolean; message: string }> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase nao configurado no projeto.' }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { ok: false, message: mapSupabaseAuthMessage(error.message) }
  }

  return { ok: true, message: 'Login realizado com sucesso.' }
}

export const signUp = async (email: string, password: string): Promise<{ ok: boolean; message: string }> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase nao configurado no projeto.' }
  }

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return { ok: false, message: mapSupabaseAuthMessage(error.message) }
  }

  if (!data.session) {
    return {
      ok: true,
      message:
        'Conta criada. Verifique seu email para confirmar antes de entrar.',
    }
  }

  return { ok: true, message: 'Conta criada e login feito com sucesso.' }
}

export const resendSignupConfirmation = async (email: string): Promise<{ ok: boolean; message: string }> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase nao configurado no projeto.' }
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })

  if (error) {
    return { ok: false, message: mapSupabaseAuthMessage(error.message) }
  }

  return { ok: true, message: 'Email de confirmacao reenviado. Confira caixa de entrada e spam.' }
}

export const sendPasswordReset = async (email: string): Promise<{ ok: boolean; message: string }> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase nao configurado no projeto.' }
  }

  const redirectTo = `${window.location.origin}/`
  let { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

  // Fallback para casos em que o dominio atual nao esta permitido no redirect.
  if (error && error.message.toLowerCase().includes('redirect')) {
    const fallback = await supabase.auth.resetPasswordForEmail(email)
    error = fallback.error
  }

  if (error) {
    return { ok: false, message: mapSupabaseAuthMessage(error.message) }
  }

  return { ok: true, message: 'Link de recuperacao enviado para seu email.' }
}

export const updateUserPassword = async (password: string): Promise<{ ok: boolean; message: string }> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase nao configurado no projeto.' }
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { ok: false, message: mapSupabaseAuthMessage(error.message) }
  }

  return { ok: true, message: 'Senha redefinida com sucesso.' }
}

export const loadExerciseVideoMapRemotely = async (
  userId: string,
): Promise<{
  ok: boolean
  map: Record<string, ExerciseVideoAttachment>
  tableMissing: boolean
}> => {
  if (!supabase) {
    return { ok: false, map: {}, tableMissing: false }
  }

  const { data, error } = await supabase
    .from('exercise_videos')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    const tableMissing =
      error.code === 'PGRST205' ||
      error.message.toLowerCase().includes('exercise_videos') ||
      error.message.toLowerCase().includes('relation')
    return { ok: false, map: {}, tableMissing }
  }

  const map: Record<string, ExerciseVideoAttachment> = {}
  ;((data ?? []) as ExerciseVideoRow[]).forEach((row) => {
    map[row.exercise_key] = {
      rawUrl: row.raw_url,
      embedUrl: row.embed_url,
      licenseLabel: row.license_label ?? '',
      notes: row.notes ?? '',
      updatedAt: row.updated_at,
    }
  })

  return { ok: true, map, tableMissing: false }
}

export const saveExerciseVideoAttachmentRemotely = async (
  userId: string,
  exerciseKey: string,
  attachment: ExerciseVideoAttachment,
): Promise<{ ok: boolean; tableMissing: boolean }> => {
  if (!supabase) {
    return { ok: false, tableMissing: false }
  }

  const { error } = await supabase
    .from('exercise_videos')
    .upsert(
      {
        user_id: userId,
        exercise_key: exerciseKey,
        raw_url: attachment.rawUrl,
        embed_url: attachment.embedUrl,
        license_label: attachment.licenseLabel || null,
        notes: attachment.notes || null,
        updated_at: attachment.updatedAt,
      },
      { onConflict: 'user_id,exercise_key' },
    )

  if (error) {
    const tableMissing =
      error.code === 'PGRST205' ||
      error.message.toLowerCase().includes('exercise_videos') ||
      error.message.toLowerCase().includes('relation')
    return { ok: false, tableMissing }
  }

  return { ok: true, tableMissing: false }
}

export const saveExerciseVideoMapRemotely = async (
  userId: string,
  map: Record<string, ExerciseVideoAttachment>,
): Promise<{ ok: boolean; tableMissing: boolean }> => {
  if (!supabase) {
    return { ok: false, tableMissing: false }
  }

  const entries = Object.entries(map)
  if (entries.length === 0) {
    return { ok: true, tableMissing: false }
  }

  const payload = entries.map(([exerciseKey, attachment]) => ({
    user_id: userId,
    exercise_key: exerciseKey,
    raw_url: attachment.rawUrl,
    embed_url: attachment.embedUrl,
    license_label: attachment.licenseLabel || null,
    notes: attachment.notes || null,
    updated_at: attachment.updatedAt,
  }))

  const { error } = await supabase
    .from('exercise_videos')
    .upsert(payload, { onConflict: 'user_id,exercise_key' })

  if (error) {
    const tableMissing =
      error.code === 'PGRST205' ||
      error.message.toLowerCase().includes('exercise_videos') ||
      error.message.toLowerCase().includes('relation')
    return { ok: false, tableMissing }
  }

  return { ok: true, tableMissing: false }
}

export const removeExerciseVideoAttachmentRemotely = async (
  userId: string,
  exerciseKey: string,
): Promise<{ ok: boolean; tableMissing: boolean }> => {
  if (!supabase) {
    return { ok: false, tableMissing: false }
  }

  const { error } = await supabase
    .from('exercise_videos')
    .delete()
    .eq('user_id', userId)
    .eq('exercise_key', exerciseKey)

  if (error) {
    const tableMissing =
      error.code === 'PGRST205' ||
      error.message.toLowerCase().includes('exercise_videos') ||
      error.message.toLowerCase().includes('relation')
    return { ok: false, tableMissing }
  }

  return { ok: true, tableMissing: false }
}

export const signOut = async (): Promise<void> => {
  if (!supabase) {
    return
  }

  await supabase.auth.signOut()
}

export const saveStudentRemotely = async (student: Student, userId: string): Promise<Student | null> => {
  if (!supabase) {
    persistStudentMeta(student.id, { whatsapp: student.whatsapp }, userId)
    return student
  }

  const shareCode = student.shareCode?.trim() || createShareCode()
  const normalizedInsertPayload: Record<string, unknown> = {
      id: student.id,
      user_id: userId,
      share_code: shareCode,
      name: student.name,
      objective: student.objective,
      adherence: student.adherence,
      streak: student.streak,
      next_session: student.nextSession,
      plan: student.plan,
      sex: student.sex ?? student.nextSession,
      training_level: student.trainingLevel ?? student.plan,
      workout_type: student.workoutType ?? student.objective,
      whatsapp: student.whatsapp ?? null,
      student_user_id: student.studentUserId ?? null,
    }

  const normalizedInsert = await (supabase
    .from('students') as unknown as {
      insert: (payload: Record<string, unknown>) => {
        select: (columns: string) => { single: () => Promise<{ data: unknown; error: unknown }> }
      }
    })
    .insert(normalizedInsertPayload)
    .select('*')
    .single()

  const parsedNormalizedStudent = parseSingle(studentRowSchema, normalizedInsert.data)
  if (!normalizedInsert.error && parsedNormalizedStudent) {
    persistStudentMeta(student.id, { whatsapp: student.whatsapp }, userId)
    return mapStudentRow(parsedNormalizedStudent, { whatsapp: student.whatsapp })
  }

  // Compatibilidade: schema antigo sem colunas normalizadas.
  const legacyInsert = await supabase
    .from('students')
    .insert({
      id: student.id,
      user_id: userId,
      name: student.name,
      objective: student.objective,
      adherence: student.adherence,
      streak: student.streak,
      next_session: student.nextSession,
      plan: student.plan,
      student_user_id: student.studentUserId ?? null,
    })
    .select('*')
    .single()

  const parsedLegacyStudent = parseSingle(studentRowSchema, legacyInsert.data)
  if (legacyInsert.error || !parsedLegacyStudent) {
    return null
  }

  persistStudentMeta(student.id, { whatsapp: student.whatsapp }, userId)
  return mapStudentRow(parsedLegacyStudent, { whatsapp: student.whatsapp })
}

export const updateStudentRemotely = async (student: Student, userId: string): Promise<boolean> => {
  if (!supabase) {
    persistStudentMeta(student.id, { whatsapp: student.whatsapp }, userId)
    return true
  }

  const normalizedUpdatePayload: Record<string, unknown> = {
      name: student.name,
      objective: student.objective,
      next_session: student.nextSession,
      plan: student.plan,
      sex: student.sex ?? student.nextSession,
      training_level: student.trainingLevel ?? student.plan,
      workout_type: student.workoutType ?? student.objective,
      whatsapp: student.whatsapp ?? null,
    }

  const normalizedUpdate = await (supabase
    .from('students') as unknown as {
      update: (payload: Record<string, unknown>) => {
        eq: (column: string, value: string) => { eq: (column: string, value: string) => Promise<{ error: unknown }> }
      }
    })
    .update(normalizedUpdatePayload)
    .eq('id', student.id)
    .eq('user_id', userId)

  if (!normalizedUpdate.error) {
    persistStudentMeta(student.id, { whatsapp: student.whatsapp }, userId)
    return true
  }

  // Compatibilidade: schema antigo sem colunas normalizadas.
  const legacyUpdate = await supabase
    .from('students')
    .update({
      name: student.name,
      objective: student.objective,
      next_session: student.nextSession,
      plan: student.plan,
    })
    .eq('id', student.id)
    .eq('user_id', userId)

  if (!legacyUpdate.error) {
    persistStudentMeta(student.id, { whatsapp: student.whatsapp }, userId)
    return true
  }

  return false
}

export const loadStudentPortalData = async (userId: string): Promise<StudentPortalData | null> => {
  if (!supabase) {
    return null
  }

  const studentResponse = await supabase
    .from('students')
    .select('*')
    .eq('student_user_id', userId)
    .maybeSingle()

  if (studentResponse.error || !studentResponse.data) {
    return null
  }

  const studentRow = parseSingle(studentRowSchema, studentResponse.data)
  if (!studentRow) {
    return null
  }

  const [sessionsResponse, exercisesResponse, financeResponse] = await Promise.all([
    supabase
      .from('sessions')
      .select('*')
      .eq('student_id', studentRow.id)
      .order('day', { ascending: true })
      .order('time', { ascending: true }),
    supabase
      .from('exercises')
      .select('*')
      .eq('student_id', studentRow.id),
    supabase.rpc('get_student_portal_finance'),
  ])

  const sessionsRows = parseRows(sessionRowSchema, sessionsResponse.error ? [] : (sessionsResponse.data ?? []))
  const exerciseRows = parseRows(exerciseRowSchema, exercisesResponse.error ? [] : (exercisesResponse.data ?? []))

  const sessions: Session[] = sessionsRows.map((item) => ({
    id: item.id,
    day: item.day,
    time: item.time,
    studentId: item.student_id,
    focus: item.focus,
    duration: item.duration,
    updatedAt: item.updated_at ?? undefined,
  }))

  const workout: Exercise[] = exerciseRows.map((item) => ({
    name: item.name,
    sets: item.sets,
    note: item.note,
    day: item.day ?? undefined,
    routine: item.routine ?? undefined,
  }))

  const financeRaw = parseSingle(
    studentPortalFinanceRowSchema,
    financeResponse.error ? null : Array.isArray(financeResponse.data) ? financeResponse.data[0] : null,
  ) as StudentPortalFinanceRow | null
  const finance = financeRaw
    ? {
        monthlyFee: Number(financeRaw.monthly_fee ?? 0),
        dueDay: Number(financeRaw.due_day ?? 10),
        paymentMethod: 'pix' as const,
        paymentStatus: (financeRaw.payment_status ?? 'pending') as 'paid' | 'pending' | 'overdue',
        monthRef: financeRaw.month_ref ?? '',
        lastPaidMonth: financeRaw.payment_status === 'paid' ? financeRaw.month_ref : null,
        lastPaidAt: financeRaw.last_paid_at,
        pixKey: (financeRaw.pix_key ?? '').trim(),
      }
    : undefined

  return {
    student: mapStudentRow(studentRow, readStudentMetaMap(userId)[studentRow.id]),
    sessions,
    workout,
    finance,
  }
}

export const claimStudentAccess = async (
  shareCode: string,
): Promise<{ ok: boolean; message: string }> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase nao configurado no projeto.' }
  }

  const normalizedCode = shareCode.trim().toUpperCase()
  if (!normalizedCode) {
    return { ok: false, message: 'Informe o codigo de acesso do aluno.' }
  }

  const { data, error } = await supabase.rpc('claim_student_access', {
    input_code: normalizedCode,
  })

  if (error) {
    return { ok: false, message: 'Nao foi possivel vincular com esse codigo agora.' }
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return { ok: false, message: 'Codigo invalido ou ja utilizado.' }
  }

  return { ok: true, message: 'Conta vinculada com sucesso ao perfil de aluno.' }
}

export const unlinkStudentAccessRemotely = async (
  studentId: string,
  userId: string,
): Promise<boolean> => {
  if (!supabase) {
    return true
  }

  const { error } = await supabase
    .from('students')
    .update({ student_user_id: null })
    .eq('id', studentId)
    .eq('user_id', userId)

  return !error
}

export const saveSessionRemotely = async (session: Session, userId: string): Promise<boolean> => {
  if (!supabase) {
    return true
  }

  const { error } = await supabase.from('sessions').insert({
    id: session.id,
    user_id: userId,
    day: session.day,
    time: session.time,
    student_id: session.studentId,
    focus: session.focus,
    duration: session.duration,
  })

  return !error
}

export const updateSessionRemotely = async (session: Session, userId: string): Promise<boolean> => {
  if (!supabase) {
    return true
  }

  const { error } = await supabase
    .from('sessions')
    .update({
      day: session.day,
      time: session.time,
      student_id: session.studentId,
      focus: session.focus,
      duration: session.duration,
    })
    .eq('id', session.id)
    .eq('user_id', userId)

  return !error
}

export const saveExercisesRemotely = async (
  studentId: string,
  exercises: Exercise[],
  userId: string,
): Promise<boolean> => {
  if (!supabase) {
    return true
  }

  const payload = exercises.map((exercise, index) => ({
    id: `${studentId}-e${index + 1}`,
    user_id: userId,
    student_id: studentId,
    name: exercise.name,
    sets: exercise.sets,
    note: exercise.note,
  }))

  const { error } = await supabase
    .from('exercises')
    .upsert(payload, { onConflict: 'id' })
  return !error
}

const normalizeExerciseForPayload = (
  exercise: Exercise,
): { name: string; sets: string; note: string; day: string; routine: string } | null => {
  const name = exercise.name.trim()
  const sets = exercise.sets.trim()
  const note = exercise.note.trim()
  const day = exercise.day?.trim() ?? ''
  const routine = exercise.routine?.trim() ?? ''
  if (!name || !sets) {
    return null
  }
  return {
    name: name.slice(0, 180),
    sets: sets.slice(0, 120),
    note: note.slice(0, 5000),
    day: day.slice(0, 24),
    routine: routine.slice(0, 24),
  }
}

const sanitizeWorkoutPayload = (
  exercises: Exercise[],
): { ok: boolean; payload: Array<{ name: string; sets: string; note: string; day: string; routine: string }>; message?: string } => {
  if (!Array.isArray(exercises)) {
    return { ok: false, payload: [], message: 'Lista de exercicios invalida.' }
  }

  if (exercises.length > 250) {
    return { ok: false, payload: [], message: 'Limite de 250 exercicios por treino.' }
  }

  const payload: Array<{ name: string; sets: string; note: string; day: string; routine: string }> = []
  for (const exercise of exercises) {
    const normalized = normalizeExerciseForPayload(exercise)
    if (!normalized) {
      return { ok: false, payload: [], message: 'Todo exercicio precisa de nome e series.' }
    }
    payload.push(normalized)
  }

  return { ok: true, payload }
}

const mapRpcErrorMessage = (rawMessage: string): string => {
  const message = rawMessage.toLowerCase()

  if (message.includes('forbidden_student')) return 'Aluno invalido ou sem permissao.'
  if (message.includes('student_not_found')) return 'Aluno nao encontrado.'
  if (message.includes('invalid_exercise_fields')) return 'Exercicio com dados invalidos.'
  if (message.includes('invalid_exercises_payload')) return 'Payload de treino invalido.'
  if (message.includes('too_many_exercises')) return 'Treino muito grande (maximo de 250 exercicios).'
  if (message.includes('not_authenticated')) return 'Sessao expirada. Faca login novamente.'
  if (message.includes('forbidden_session')) return 'Sessao invalida para este aluno.'
  if (message.includes('invalid_adherence_delta')) return 'Delta de aderencia invalido.'
  if (message.includes('invalid_streak_delta')) return 'Delta de sequencia invalido.'

  return rawMessage
}

/**
 * Salva o treino completo de um aluno em uma unica transacao no banco (RPC).
 * Em caso de schema antigo sem RPC, o chamador pode acionar fallback legado.
 */
export const saveStudentWorkoutAtomicallyRemotely = async (
  studentId: string,
  exercises: Exercise[],
  userId: string,
): Promise<{ ok: boolean; message: string }> => {
  if (!supabase) {
    return { ok: true, message: 'Supabase indisponivel. Treino salvo localmente.' }
  }

  const normalizedStudentId = studentId.trim()
  if (!normalizedStudentId) {
    return { ok: false, message: 'Aluno invalido para salvar treino.' }
  }

  const normalizedUserId = userId.trim()
  if (!normalizedUserId) {
    return { ok: false, message: 'Usuario invalido para salvar treino.' }
  }

  const sanitized = sanitizeWorkoutPayload(exercises)
  if (!sanitized.ok) {
    return { ok: false, message: sanitized.message ?? 'Dados do treino invalidos.' }
  }

  const rpc = await supabase.rpc('save_student_workout_atomic', {
    input_student_id: normalizedStudentId,
    input_exercises: sanitized.payload,
  })

  if (rpc.error) {
    return {
      ok: false,
      message: mapRpcErrorMessage(rpc.error.message),
    }
  }

  return { ok: true, message: 'Treino salvo e sincronizado.' }
}

export const replaceExercisesRemotely = async (
  studentId: string,
  exercises: Exercise[],
  userId: string,
): Promise<boolean> => {
  if (!supabase) {
    return true
  }

  const { error: deleteError } = await supabase
    .from('exercises')
    .delete()
    .eq('user_id', userId)
    .eq('student_id', studentId)

  if (deleteError) {
    return false
  }

  if (exercises.length === 0) {
    return true
  }

  const payload = exercises.map((exercise, index) => ({
    id: `${studentId}-e${index + 1}`,
    user_id: userId,
    student_id: studentId,
    name: exercise.name,
    sets: exercise.sets,
    note: exercise.note,
  }))

  const { error: insertError } = await supabase
    .from('exercises')
    .insert(payload)

  return !insertError
}

/**
 * Sincroniza progresso do aluno (aderencia/streak) e log de historico de forma atomica.
 */
export const syncStudentProgressAtomicallyRemotely = async (input: {
  studentId: string
  sessionId: string
  adherenceDelta: number
  streakDelta: number
  isCompleting: boolean
  userId: string
}): Promise<{ ok: boolean; nextAdherence?: number; nextStreak?: number; message?: string }> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase indisponivel para sincronizar progresso.' }
  }

  const studentId = input.studentId.trim()
  const sessionId = input.sessionId.trim()
  const userId = input.userId.trim()
  if (!studentId || !sessionId || !userId) {
    return { ok: false, message: 'Dados invalidos para sincronizar progresso.' }
  }

  if (!Number.isFinite(input.adherenceDelta) || input.adherenceDelta < -100 || input.adherenceDelta > 100) {
    return { ok: false, message: 'Delta de aderencia invalido.' }
  }

  if (!Number.isFinite(input.streakDelta) || input.streakDelta < -30 || input.streakDelta > 30) {
    return { ok: false, message: 'Delta de sequencia invalido.' }
  }

  const rpc = await supabase.rpc('sync_student_progress_atomic', {
    input_student_id: studentId,
    input_session_id: sessionId,
    input_adherence_delta: Math.trunc(input.adherenceDelta),
    input_streak_delta: Math.trunc(input.streakDelta),
    input_is_completing: input.isCompleting,
  })

  if (rpc.error) {
    return { ok: false, message: mapRpcErrorMessage(rpc.error.message) }
  }

  const row = Array.isArray(rpc.data) ? rpc.data[0] : null
  return {
    ok: true,
    nextAdherence: typeof row?.next_adherence === 'number' ? row.next_adherence : undefined,
    nextStreak: typeof row?.next_streak === 'number' ? row.next_streak : undefined,
  }
}
