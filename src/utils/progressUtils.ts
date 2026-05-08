import type { ProgressHistoryEntry } from '../types/workout'

const STORAGE_KEY = 'insane-fit.progress-history:v1'

const storageKey = (userId?: string) => (userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY)

/** Garante que um numero percentual fique entre 0 e 100. */
export const clampToPercent = (value: number): number => Math.min(100, Math.max(0, Math.round(value)))

export const loadProgressHistory = (userId?: string): Record<string, ProgressHistoryEntry[]> => {
  try {
    const serialized = window.localStorage.getItem(storageKey(userId))
    return serialized ? (JSON.parse(serialized) as Record<string, ProgressHistoryEntry[]>) : {}
  } catch {
    return {}
  }
}

export const persistProgressHistory = (
  history: Record<string, ProgressHistoryEntry[]>,
  userId?: string,
): void => {
  window.localStorage.setItem(storageKey(userId), JSON.stringify(history))
}

export const purgeStudentProgressHistory = (studentId: string, userId?: string): void => {
  const scopes = Array.from(new Set([userId, undefined]))

  scopes.forEach((scopeUserId) => {
    const key = storageKey(scopeUserId)
    try {
      const serialized = window.localStorage.getItem(key)
      if (!serialized) return
      const current = JSON.parse(serialized) as Record<string, ProgressHistoryEntry[]>
      if (!current[studentId]) return
      const next = { ...current }
      delete next[studentId]
      window.localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // ignore corrupted storage entries
    }
  })
}
