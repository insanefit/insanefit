import { supabase } from '../lib/supabase'
import type { Session } from '../types/trainer'

// ---------------------------------------------------------------------------
// Session operations
// ---------------------------------------------------------------------------

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
