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

