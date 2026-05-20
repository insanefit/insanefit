import { supabase } from '../lib/supabase'
import type { Exercise, Session, StudentPortalData } from '../types/trainer'
import { exerciseRowSchema, parseRows, parseSingle, sessionRowSchema, studentRowSchema } from '../schemas/supabaseSchemas'
import { mapStudentRow } from './studentService'
import { readStudentMetaMap } from './storage'

// ---------------------------------------------------------------------------
// Portal
// ---------------------------------------------------------------------------

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

  const [sessionsResponse, exercisesResponse] = await Promise.all([
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

  return {
    student: mapStudentRow(studentRow, readStudentMetaMap(userId)[studentRow.id]),
    sessions,
    workout,
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
