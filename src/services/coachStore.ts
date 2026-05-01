import { hasSupabaseCredentials, supabase } from '../lib/supabase'
import type { CoachProfile } from '../types/coach'

const coachStorageKey = 'insanefit:coach:v1'
const legacyCoachStorageKey = 'pulsecoach:coach:v1'

type CoachRow = {
  display_name: string | null
  coach_title: string | null
  phone: string | null
  instagram: string | null
  bio: string | null
  coach_avatar_url: string | null
}

export const defaultCoachProfile: CoachProfile = {
  displayName: '',
  title: 'Personal Trainer',
  phone: '',
  instagram: '',
  bio: '',
  avatarUrl: '',
}

const scopedCoachKey = (baseKey: string, userId?: string): string =>
  userId ? `${baseKey}:${userId}` : baseKey

const readRawCoachProfile = (baseKey: string, userId?: string): string | null =>
  localStorage.getItem(scopedCoachKey(baseKey, userId))

const readLocalCoachProfile = (userId?: string): CoachProfile | null => {
  try {
    const currentKeyRaw = readRawCoachProfile(coachStorageKey, userId)
    const legacyRaw = currentKeyRaw ? null : readRawCoachProfile(legacyCoachStorageKey, userId)
    const raw = currentKeyRaw ?? legacyRaw
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<CoachProfile>

    const profile = {
      displayName: parsed.displayName ?? '',
      title: parsed.title ?? 'Personal Trainer',
      phone: parsed.phone ?? '',
      instagram: parsed.instagram ?? '',
      bio: parsed.bio ?? '',
      avatarUrl: parsed.avatarUrl ?? '',
    }

    // Migrate legacy key to Insane Fit key transparently.
    if (!currentKeyRaw && legacyRaw) {
      localStorage.setItem(scopedCoachKey(coachStorageKey, userId), JSON.stringify(profile))
      localStorage.removeItem(scopedCoachKey(legacyCoachStorageKey, userId))
    }

    return profile
  } catch {
    return null
  }
}

const persistLocalCoachProfile = (profile: CoachProfile, userId?: string) => {
  localStorage.setItem(scopedCoachKey(coachStorageKey, userId), JSON.stringify(profile))
}

const mapCoachRow = (row: CoachRow): CoachProfile => ({
  displayName: row.display_name ?? '',
  title: row.coach_title ?? 'Personal Trainer',
  phone: row.phone ?? '',
  instagram: row.instagram ?? '',
  bio: row.bio ?? '',
  avatarUrl: row.coach_avatar_url ?? '',
})

export const loadCoachProfile = async (userId?: string): Promise<CoachProfile> => {
  if (hasSupabaseCredentials && userId && supabase) {
    const response = await supabase
      .from('trainer_profiles')
      .select('display_name, coach_title, phone, instagram, bio, coach_avatar_url')
      .eq('user_id', userId)
      .maybeSingle()

    if (!response.error && response.data) {
      const mapped = mapCoachRow(response.data as CoachRow)
      persistLocalCoachProfile(mapped, userId)
      return mapped
    }
  }

  return readLocalCoachProfile(userId) ?? defaultCoachProfile
}

export const saveCoachProfile = async (
  profile: CoachProfile,
  userId?: string,
): Promise<{ ok: boolean; synced: boolean }> => {
  persistLocalCoachProfile(profile, userId)

  if (hasSupabaseCredentials && userId && supabase) {
    const { error } = await supabase
      .from('trainer_profiles')
      .upsert(
        {
          user_id: userId,
          display_name: profile.displayName,
          coach_title: profile.title,
          phone: profile.phone || null,
          instagram: profile.instagram || null,
          bio: profile.bio || null,
          coach_avatar_url: profile.avatarUrl || null,
        },
        { onConflict: 'user_id' },
      )

    if (error) {
      return { ok: true, synced: false }
    }

    return { ok: true, synced: true }
  }

  return { ok: true, synced: false }
}
