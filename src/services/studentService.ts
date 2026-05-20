import { hasSupabaseCredentials, supabase } from '../lib/supabase'
import type { Session, Student, TrainerData, WorkoutByStudent } from '../types/trainer'
import type { z } from 'zod'
import { buildCurrentMonthRef } from './paymentStore'
import {
  exerciseRowSchema,
  parseRows,
  parseSingle,
  sessionRowSchema,
  studentPaymentSummaryRowSchema,
  studentRowSchema,
  trainerProfilePixSchema,
} from '../schemas/supabaseSchemas'
import {
  buildEmptyTrainerData,
  createShareCode,
  dataStorageKey,
  isMissingColumnError,
  legacyDataStorageKey,
  normalizeLookup,
  persistStudentMeta,
  pickString,
  pruneExpiredDeletedStudentFingerprints,
  readDeletedStudentFingerprints,
  readQueueInsights,
  readScopedStorage,
  readStudentMetaMap,
  readStorage,
  removeStudentFromTrainerData,
  scopedKey,
  stripUnsupportedColumnAndRetry,
  writeDeletedStudentFingerprints,
  writeStorage,
  type DeletedStudentFingerprint,
  type QueueInsights,
  type StudentMeta,
} from './storage'

type StudentRow = z.infer<typeof studentRowSchema>
type SessionRow = z.infer<typeof sessionRowSchema>
type ExerciseRow = z.infer<typeof exerciseRowSchema>

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

const parseSexFromValue = (value: string): string | undefined => {
  const normalized = normalizeLookup(value)
  if (!normalized) return undefined
  if (normalized === 'masculino') return 'Masculino'
  if (normalized === 'feminino') return 'Feminino'
  if (normalized === 'outro') return 'Outro'
  return undefined
}

const parseTrainingLevelFromValue = (value: string): string | undefined => {
  const normalized = normalizeLookup(value)
  if (!normalized) return undefined
  if (normalized === 'iniciante') return 'Iniciante'
  if (normalized === 'intermediario') return 'Intermediario'
  if (normalized === 'avancado') return 'Avancado'
  return undefined
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

export const mapStudentRow = (item: StudentRow, meta?: StudentMeta): Student => {
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
    accessStartDate: item.access_start_date ?? undefined,
    accessEndDate: item.access_end_date ?? undefined,
    updatedAt: item.updated_at ?? undefined,
  }
}

export const mapSupabaseData = (
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

  return { students, sessions, workoutByStudent }
}

export const mergePendingLocalStudents = (
  remoteData: TrainerData,
  localData: TrainerData,
  queueInsights: QueueInsights,
): TrainerData => {
  const remoteById = new Map(remoteData.students.map((s) => [s.id, s]))
  const mergedStudents = [...remoteData.students]

  localData.students.forEach((localStudent) => {
    if (queueInsights.pendingDeleteIds.has(localStudent.id)) return
    const shouldInsert = !remoteById.has(localStudent.id)
    const shouldPatch = queueInsights.pendingUpdateIds.has(localStudent.id) && remoteById.has(localStudent.id)

    if (shouldInsert) {
      mergedStudents.push(localStudent)
      remoteById.set(localStudent.id, localStudent)
      return
    }
    if (shouldPatch) {
      const index = mergedStudents.findIndex((s) => s.id === localStudent.id)
      if (index >= 0) mergedStudents[index] = localStudent
    }
  })

  const filteredStudents = mergedStudents.filter((s) => !queueInsights.pendingDeleteIds.has(s.id))
  const visibleIds = new Set(filteredStudents.map((s) => s.id))

  const mergedSessions = [
    ...remoteData.sessions.filter((s) => visibleIds.has(s.studentId)),
    ...localData.sessions.filter(
      (s) =>
        visibleIds.has(s.studentId) &&
        queueInsights.pendingCreateIds.has(s.studentId) &&
        !remoteData.sessions.some((rs) => rs.id === s.id),
    ),
  ]

  const workoutByStudent: WorkoutByStudent = {}
  visibleIds.forEach((studentId) => {
    if (queueInsights.pendingWorkoutSaveIds.has(studentId)) {
      workoutByStudent[studentId] = localData.workoutByStudent[studentId] ?? []
      return
    }
    const remote = remoteData.workoutByStudent[studentId]
    if (remote && remote.length > 0) { workoutByStudent[studentId] = remote; return }
    const local = localData.workoutByStudent[studentId]
    if (local && local.length > 0) workoutByStudent[studentId] = local
  })

  return { students: filteredStudents, sessions: mergedSessions, workoutByStudent }
}

// ---------------------------------------------------------------------------
// Load from Supabase
// ---------------------------------------------------------------------------

const loadFromSupabase = async (userId: string): Promise<TrainerData | null> => {
  if (!supabase) return null

  const monthRef = buildCurrentMonthRef()
  const [studentsRes, sessionsRes, exercisesRes, paymentsRes, profileRes] = await Promise.all([
    supabase.from('students').select('*').eq('user_id', userId).order('name', { ascending: true }),
    supabase.from('sessions').select('*').eq('user_id', userId).order('day', { ascending: true }).order('time', { ascending: true }),
    supabase.from('exercises').select('*').eq('user_id', userId),
    supabase.from('student_payments').select('student_id,monthly_fee,due_day').eq('user_id', userId).eq('month_ref', monthRef),
    supabase.from('trainer_profiles').select('pix_key').eq('user_id', userId).maybeSingle(),
  ])

  if (studentsRes.error) return null

  const paymentRows = parseRows(studentPaymentSummaryRowSchema, paymentsRes.error ? [] : (paymentsRes.data ?? []))
  const paymentByStudent = paymentRows.reduce<Record<string, { monthlyFee: number; dueDay: number }>>((acc, row) => {
    acc[row.student_id] = { monthlyFee: Number(row.monthly_fee ?? 0), dueDay: Number(row.due_day ?? 10) }
    return acc
  }, {})
  const pixProfile = parseSingle(trainerProfilePixSchema, profileRes.error ? null : profileRes.data)
  const pixKey = pixProfile?.pix_key?.trim() ?? ''

  const parsedStudents = parseRows(studentRowSchema, studentsRes.data ?? [])
  pruneExpiredDeletedStudentFingerprints(userId)
  const deleted = readDeletedStudentFingerprints(userId)
  const deletedIds = new Set(deleted.map((d) => d.id))
  const deletedCodes = new Set(deleted.map((d) => d.shareCode?.trim()).filter((c): c is string => Boolean(c)))
  const visibleRows = parsedStudents.filter((r) => {
    if (deletedIds.has(r.id)) return false
    const sc = r.share_code?.trim()
    if (sc && deletedCodes.has(sc)) return false
    return true
  })
  const visibleIds = new Set(visibleRows.map((r) => r.id))
  const visibleSessions = parseRows(sessionRowSchema, sessionsRes.error ? [] : (sessionsRes.data ?? [])).filter((r) => visibleIds.has(r.student_id))
  const visibleExercises = parseRows(exerciseRowSchema, exercisesRes.error ? [] : (exercisesRes.data ?? [])).filter((r) => visibleIds.has(r.student_id))

  return mapSupabaseData(visibleRows, visibleSessions, visibleExercises, readStudentMetaMap(userId), paymentByStudent, pixKey)
}

export const loadTrainerData = async (userId?: string): Promise<TrainerData> => {
  if (hasSupabaseCredentials && userId) {
    const localData = readScopedStorage<TrainerData>(dataStorageKey, legacyDataStorageKey, userId)
    const qi = readQueueInsights(userId)
    let cloud: TrainerData | null = null
    try { cloud = await loadFromSupabase(userId) } catch { cloud = null }
    if (!cloud) return localData ?? buildEmptyTrainerData()
    const hasPending = qi.pendingCreateIds.size > 0 || qi.pendingUpdateIds.size > 0 || qi.pendingDeleteIds.size > 0 || qi.pendingWorkoutSaveIds.size > 0
    const final = (hasPending || localData) && localData ? mergePendingLocalStudents(cloud, localData, qi) : cloud
    writeStorage(scopedKey(dataStorageKey, userId), final)
    return final
  }
  if (hasSupabaseCredentials && !userId) return { students: [], sessions: [], workoutByStudent: {} }
  const localData = readScopedStorage<TrainerData>(dataStorageKey, legacyDataStorageKey, userId)
  if (localData) return localData
  const fallback = buildEmptyTrainerData()
  writeStorage(scopedKey(dataStorageKey, userId), fallback)
  return fallback
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export const purgeStudentFromLocalCaches = (studentId: string, userId?: string): void => {
  const scopes = Array.from(new Set([userId, undefined]))
  scopes.forEach((uid) => {
    const ck = scopedKey(dataStorageKey, uid)
    const lk = scopedKey(legacyDataStorageKey, uid)
    const cd = readStorage<TrainerData>(ck)
    if (cd) writeStorage(ck, removeStudentFromTrainerData(cd, studentId))
    const ld = readStorage<TrainerData>(lk)
    if (ld) writeStorage(lk, removeStudentFromTrainerData(ld, studentId))
    const mm = readStudentMetaMap(uid)
    if (mm[studentId]) { delete mm[studentId]; writeStorage(scopedKey('insanefit:student_meta:v1', uid), mm) }
    const di = readDeletedStudentFingerprints(uid)
    if (!di.some((i) => i.id === studentId)) {
      writeDeletedStudentFingerprints([...di, { id: studentId, removedAt: new Date().toISOString() }], uid)
    }
  })
}

export const markStudentLocallyDeleted = (input: { id: string; shareCode?: string; name?: string }, userId?: string) => {
  const current = readDeletedStudentFingerprints(userId)
  const idx = current.findIndex((i) => i.id === input.id)
  const payload: DeletedStudentFingerprint = {
    id: input.id, shareCode: input.shareCode?.trim() || undefined,
    name: input.name?.trim() || undefined, removedAt: new Date().toISOString(),
  }
  if (idx >= 0) { const next = [...current]; next[idx] = { ...next[idx], ...payload }; writeDeletedStudentFingerprints(next, userId); return }
  writeDeletedStudentFingerprints([...current, payload], userId)
}

export const saveStudentRemotely = async (student: Student, userId: string): Promise<Student | null> => {
  if (!supabase) { persistStudentMeta(student.id, { whatsapp: student.whatsapp }, userId); return student }
  const client = supabase
  const shareCode = student.shareCode?.trim() || createShareCode()
  const updatedAt = new Date().toISOString()
  const insertPayload: Record<string, unknown> = {
    id: student.id, user_id: userId, share_code: shareCode, name: student.name,
    objective: student.objective, adherence: student.adherence, streak: student.streak,
    next_session: student.nextSession, plan: student.plan,
    sex: student.sex ?? student.nextSession, training_level: student.trainingLevel ?? student.plan,
    workout_type: student.workoutType ?? student.objective, whatsapp: student.whatsapp ?? null,
    student_user_id: student.studentUserId ?? null, access_start_date: student.accessStartDate ?? null,
    access_end_date: student.accessEndDate ?? null, updated_at: student.updatedAt ?? updatedAt,
  }

  const normalizedInsert = await stripUnsupportedColumnAndRetry(
    async (p) => (client.from('students') as unknown as { upsert: (p: Record<string, unknown>, o: { onConflict: string }) => Promise<{ error: unknown }> }).upsert(p, { onConflict: 'id' }),
    insertPayload,
  )

  if (normalizedInsert.ok) {
    const v = await client.from('students').select('*').eq('id', student.id).eq('user_id', userId).maybeSingle()
    const vr = parseSingle(studentRowSchema, v.error ? null : v.data)
    if (!vr) return null
    persistStudentMeta(student.id, { whatsapp: student.whatsapp }, userId)
    return mapStudentRow(vr, readStudentMetaMap(userId))
  }

  if (!isMissingColumnError(normalizedInsert.error)) return null

  const legacy = await client.from('students').upsert({
    id: student.id, user_id: userId, name: student.name, objective: student.objective,
    adherence: student.adherence, streak: student.streak, next_session: student.nextSession,
    plan: student.plan, student_user_id: student.studentUserId ?? null,
  }, { onConflict: 'id' })
  if (legacy.error) return null

  const lv = await client.from('students').select('*').eq('id', student.id).eq('user_id', userId).maybeSingle()
  const lvr = parseSingle(studentRowSchema, lv.error ? null : lv.data)
  if (!lvr) return null
  persistStudentMeta(student.id, { whatsapp: student.whatsapp }, userId)
  return mapStudentRow(lvr, readStudentMetaMap(userId))
}

export const updateStudentRemotely = async (student: Student, userId: string): Promise<boolean> => {
  if (!supabase) { persistStudentMeta(student.id, { whatsapp: student.whatsapp }, userId); return true }
  const client = supabase
  const updatePayload: Record<string, unknown> = {
    name: student.name, objective: student.objective, next_session: student.nextSession, plan: student.plan,
    sex: student.sex ?? student.nextSession, training_level: student.trainingLevel ?? student.plan,
    workout_type: student.workoutType ?? student.objective, whatsapp: student.whatsapp ?? null,
    access_start_date: student.accessStartDate ?? null, access_end_date: student.accessEndDate ?? null,
  }

  const normalized = await stripUnsupportedColumnAndRetry(
    async (p) => (client.from('students') as unknown as { update: (p: Record<string, unknown>) => { eq: (c: string, v: string) => { eq: (c: string, v: string) => Promise<{ error: unknown }> } } }).update(p).eq('id', student.id).eq('user_id', userId),
    updatePayload,
  )
  if (normalized.ok) { persistStudentMeta(student.id, { whatsapp: student.whatsapp }, userId); return true }
  if (!isMissingColumnError(normalized.error)) return false

  const legacy = await client.from('students').update({ name: student.name, objective: student.objective, next_session: student.nextSession, plan: student.plan }).eq('id', student.id).eq('user_id', userId)
  if (!legacy.error) { persistStudentMeta(student.id, { whatsapp: student.whatsapp }, userId); return true }
  return false
}

export const deleteStudentRemotely = async (studentId: string, userId: string): Promise<boolean> => {
  if (!supabase) { persistStudentMeta(studentId, { whatsapp: '' }, userId); return true }
  const existing = await supabase.from('students').select('id').eq('id', studentId).eq('user_id', userId).maybeSingle()
  if (!existing.error && !existing.data) { persistStudentMeta(studentId, { whatsapp: '' }, userId); return true }
  await supabase.from('student_payments').delete().eq('student_id', studentId).eq('user_id', userId)
  await supabase.from('sessions').delete().eq('student_id', studentId).eq('user_id', userId)
  await supabase.from('exercises').delete().eq('student_id', studentId).eq('user_id', userId)
  const { error } = await supabase.from('students').delete().eq('id', studentId).eq('user_id', userId)
  if (error) return false
  const verify = await supabase.from('students').select('id').eq('id', studentId).eq('user_id', userId).maybeSingle()
  if (!verify.error && verify.data) return false
  persistStudentMeta(studentId, { whatsapp: '' }, userId)
  return true
}
