import { supabase } from '../lib/supabase'
import type { ExerciseVideoAttachment } from '../types/video'

type ExerciseVideoRow = {
  user_id: string
  exercise_key: string
  raw_url: string
  embed_url: string
  license_label: string | null
  notes: string | null
  updated_at: string
}

// ---------------------------------------------------------------------------
// Video operations
// ---------------------------------------------------------------------------

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
