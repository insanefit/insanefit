import { supabase } from '../lib/supabase'
import type { Exercise } from '../types/trainer'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

export const sanitizeWorkoutPayload = (
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

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

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
    const legacySaved = await replaceExercisesRemotely(normalizedStudentId, exercises, normalizedUserId)
    if (legacySaved) {
      return {
        ok: true,
        message: 'Treino salvo com fallback de compatibilidade.',
      }
    }

    return {
      ok: false,
      message: mapRpcErrorMessage(rpc.error.message),
    }
  }

  return { ok: true, message: 'Treino salvo e sincronizado.' }
}

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
