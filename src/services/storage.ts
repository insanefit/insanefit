import type { TrainerData } from '../types/trainer'

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

export const dataStorageKey = 'insanefit:data:v1'
export const doneStorageKey = 'insanefit:done:v1'
export const legacyDataStorageKey = 'pulsecoach:data:v1'
export const legacyDoneStorageKey = 'pulsecoach:done:v1'
export const studentMetaStorageKey = 'insanefit:student_meta:v1'
export const deletedStudentsStorageKey = 'insanefit:deleted_students:v1'
export const syncQueueStorageKey = 'insanefit:sync_queue:v1'
export const deletedStudentRetentionMs = 90 * 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StudentMeta = {
  whatsapp?: string
}

export type DeletedStudentFingerprint = {
  id: string
  shareCode?: string
  name?: string
  removedAt: string
}

export type SupabaseErrorLike = {
  code?: string | null
  message?: string | null
}

import { getItemAsync, setItemAsync, removeItemAsync } from '../lib/offlineDb'

// ---------------------------------------------------------------------------
// Generic storage helpers (Sync & Async IndexedDB)
// ---------------------------------------------------------------------------

export const readStorage = <T>(key: string): T | null => {
  try {
    const content = localStorage.getItem(key)
    return content ? (JSON.parse(content) as T) : null
  } catch {
    return null
  }
}

export const writeStorage = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore quota/disabled errors
  }
}

export const readStorageAsync = async <T>(key: string): Promise<T | null> => {
  const asyncValue = await getItemAsync<T>(key)
  if (asyncValue !== null) return asyncValue
  return readStorage<T>(key)
}

export const writeStorageAsync = async <T>(key: string, value: T): Promise<void> => {
  writeStorage(key, value)
  await setItemAsync(key, value)
}

export const removeStorageAsync = async (key: string): Promise<void> => {
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore
  }
  await removeItemAsync(key)
}

export const scopedKey = (base: string, userId?: string): string =>
  userId ? `${base}:${userId}` : base

export const readScopedStorage = <T>(
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
  try {
    localStorage.removeItem(legacyKey)
  } catch {
    // Ignore
  }
  return legacyValue
}

export const readScopedStorageAsync = async <T>(
  currentBase: string,
  legacyBase: string,
  userId?: string,
): Promise<T | null> => {
  const currentKey = scopedKey(currentBase, userId)
  const currentValue = await readStorageAsync<T>(currentKey)
  if (currentValue) return currentValue

  const legacyKey = scopedKey(legacyBase, userId)
  const legacyValue = await readStorageAsync<T>(legacyKey)
  if (!legacyValue) return null

  await writeStorageAsync(currentKey, legacyValue)
  await removeStorageAsync(legacyKey)
  return legacyValue
}

/** Migra chaves do localStorage para IndexedDB automaticamente */
export const migrateLocalStorageToIndexedDB = async (): Promise<boolean> => {
  try {
    const isMigrated = await getItemAsync<boolean>('insanefit_migrated_v1', 'migration_meta')
    if (isMigrated) return true

    if (typeof localStorage !== 'undefined') {
      const keysToMigrate: string[] = []
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('insanefit:') || key.startsWith('pulsecoach:'))) {
          keysToMigrate.push(key)
        }
      }

      for (const key of keysToMigrate) {
        const raw = localStorage.getItem(key)
        if (raw) {
          try {
            const parsed = JSON.parse(raw)
            await setItemAsync(key, parsed)
          } catch {
            await setItemAsync(key, raw)
          }
        }
      }
    }

    await setItemAsync('insanefit_migrated_v1', true, 'migration_meta')
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Student meta helpers
// ---------------------------------------------------------------------------

export const readStudentMetaMap = (userId?: string): Record<string, StudentMeta> =>
  readStorage<Record<string, StudentMeta>>(scopedKey(studentMetaStorageKey, userId)) ?? {}

export const writeStudentMetaMap = (map: Record<string, StudentMeta>, userId?: string) => {
  writeStorage(scopedKey(studentMetaStorageKey, userId), map)
}

export const persistStudentMeta = (studentId: string, meta: StudentMeta, userId?: string) => {
  const map = readStudentMetaMap(userId)
  if (!meta.whatsapp?.trim()) {
    delete map[studentId]
  } else {
    map[studentId] = { whatsapp: meta.whatsapp.trim() }
  }
  writeStudentMetaMap(map, userId)
}

// ---------------------------------------------------------------------------
// Deleted student fingerprints
// ---------------------------------------------------------------------------

export const readDeletedStudentFingerprints = (userId?: string): DeletedStudentFingerprint[] => {
  const raw = readStorage<unknown[]>(scopedKey(deletedStudentsStorageKey, userId))
  if (!Array.isArray(raw)) return []

  const next: DeletedStudentFingerprint[] = []
  raw.forEach((item) => {
    if (typeof item === 'string') {
      const id = item.trim()
      if (!id) return
      next.push({ id, removedAt: new Date().toISOString() })
      return
    }
    if (!item || typeof item !== 'object') return
    const candidate = item as Partial<DeletedStudentFingerprint>
    const id = typeof candidate.id === 'string' ? candidate.id.trim() : ''
    if (!id) return
    next.push({
      id,
      shareCode: typeof candidate.shareCode === 'string' ? candidate.shareCode.trim() || undefined : undefined,
      name: typeof candidate.name === 'string' ? candidate.name.trim() || undefined : undefined,
      removedAt:
        typeof candidate.removedAt === 'string' && candidate.removedAt.trim()
          ? candidate.removedAt
          : new Date().toISOString(),
    })
  })
  return next
}

export const writeDeletedStudentFingerprints = (items: DeletedStudentFingerprint[], userId?: string) => {
  const map = new Map<string, DeletedStudentFingerprint>()
  items.forEach((item) => {
    if (!item.id?.trim()) return
    map.set(item.id, {
      id: item.id,
      shareCode: item.shareCode?.trim() || undefined,
      name: item.name?.trim() || undefined,
      removedAt: item.removedAt || new Date().toISOString(),
    })
  })
  writeStorage(scopedKey(deletedStudentsStorageKey, userId), Array.from(map.values()))
}

export const pruneExpiredDeletedStudentFingerprints = (userId: string) => {
  const deletedItems = readDeletedStudentFingerprints(userId)
  if (deletedItems.length === 0) return

  const now = Date.now()
  const next = deletedItems.filter((item) => {
    const removedAt = Date.parse(item.removedAt)
    if (!Number.isFinite(removedAt)) return true
    return now - removedAt < deletedStudentRetentionMs
  })

  if (next.length !== deletedItems.length) {
    writeDeletedStudentFingerprints(next, userId)
  }
}

// ---------------------------------------------------------------------------
// Trainer data persistence
// ---------------------------------------------------------------------------

export const buildEmptyTrainerData = (): TrainerData => ({
  students: [],
  sessions: [],
  workoutByStudent: {},
})

export const persistLocalTrainerData = (data: TrainerData, userId?: string) => {
  writeStorage(scopedKey(dataStorageKey, userId), data)
}

export const persistLocalTrainerDataAsync = async (data: TrainerData, userId?: string): Promise<void> => {
  await writeStorageAsync(scopedKey(dataStorageKey, userId), data)
}

export const loadDoneSessions = (userId?: string): string[] =>
  readScopedStorage<string[]>(doneStorageKey, legacyDoneStorageKey, userId) ?? []

export const loadDoneSessionsAsync = async (userId?: string): Promise<string[]> =>
  (await readScopedStorageAsync<string[]>(doneStorageKey, legacyDoneStorageKey, userId)) ?? []

export const persistDoneSessions = (doneSessions: string[], userId?: string) => {
  writeStorage(scopedKey(doneStorageKey, userId), doneSessions)
}

export const persistDoneSessionsAsync = async (doneSessions: string[], userId?: string): Promise<void> => {
  await writeStorageAsync(scopedKey(doneStorageKey, userId), doneSessions)
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

export const removeStudentFromTrainerData = (data: TrainerData, studentId: string): TrainerData => {
  const nextStudents = data.students.filter((student) => student.id !== studentId)
  const nextSessions = data.sessions.filter((session) => session.studentId !== studentId)
  const nextWorkoutByStudent = { ...data.workoutByStudent }
  delete nextWorkoutByStudent[studentId]

  return {
    ...data,
    students: nextStudents,
    sessions: nextSessions,
    workoutByStudent: nextWorkoutByStudent,
  }
}

export const normalizeLookup = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

export const createShareCode = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let index = 0; index < 8; index += 1) {
    const randomIndex = Math.floor(Math.random() * alphabet.length)
    code += alphabet[randomIndex]
  }
  return code
}

export const pickString = (...values: Array<string | null | undefined>): string | undefined => {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return undefined
}

export const extractMissingColumnFromError = (error: unknown): string | null => {
  if (!error || typeof error !== 'object') return null
  const candidate = error as SupabaseErrorLike
  const message = (candidate.message ?? '').trim()
  if (!message) return null

  const postgresMatch = message.match(/column\s+"([^"]+)"\s+/i)
  if (postgresMatch?.[1]) return postgresMatch[1]

  const postgrestMatch = message.match(/'([^']+)'\s+column/i)
  if (postgrestMatch?.[1]) return postgrestMatch[1]

  return null
}

export const isMissingColumnError = (error: unknown): boolean =>
  extractMissingColumnFromError(error) !== null

export const stripUnsupportedColumnAndRetry = async (
  operation: (payload: Record<string, unknown>) => Promise<{ error: unknown }>,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; payload: Record<string, unknown>; error: unknown }> => {
  const nextPayload = { ...payload }
  let lastError: unknown = null

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const result = await operation(nextPayload)
    if (!result.error) {
      return { ok: true, payload: nextPayload, error: null }
    }

    lastError = result.error
    const missingColumn = extractMissingColumnFromError(result.error)
    if (!missingColumn || !(missingColumn in nextPayload)) {
      return { ok: false, payload: nextPayload, error: result.error }
    }

    delete nextPayload[missingColumn]
  }

  return { ok: false, payload: nextPayload, error: lastError }
}

// ---------------------------------------------------------------------------
// Sync queue insights
// ---------------------------------------------------------------------------

import type { Student } from '../types/trainer'

export type QueueStudentSnapshot = {
  id: string
  name: string
  shareCode?: string
}

export type QueueInsights = {
  pendingCreateIds: Set<string>
  pendingUpdateIds: Set<string>
  pendingDeleteIds: Set<string>
  pendingWorkoutSaveIds: Set<string>
  pendingStudentsById: Map<string, QueueStudentSnapshot>
}

export const readQueueInsights = (userId: string): QueueInsights => {
  const empty: QueueInsights = {
    pendingCreateIds: new Set(),
    pendingUpdateIds: new Set(),
    pendingDeleteIds: new Set(),
    pendingWorkoutSaveIds: new Set(),
    pendingStudentsById: new Map(),
  }

  const queue = readStorage<unknown[]>(`${syncQueueStorageKey}:${userId}`)
  if (!Array.isArray(queue) || queue.length === 0) return empty

  queue.forEach((operation) => {
    if (!operation || typeof operation !== 'object') return
    const candidate = operation as {
      type?: string
      payload?: {
        student?: Partial<Student>
        studentId?: string
        shareCode?: string
        name?: string
      }
    }

    if (candidate.type === 'student.create' || candidate.type === 'student.update') {
      const student = candidate.payload?.student
      if (!student || typeof student.id !== 'string') return
      const id = student.id.trim()
      if (!id) return
      if (candidate.type === 'student.create') empty.pendingCreateIds.add(id)
      if (candidate.type === 'student.update') empty.pendingUpdateIds.add(id)
      if (typeof student.name === 'string' && student.name.trim()) {
        empty.pendingStudentsById.set(id, {
          id,
          name: student.name.trim(),
          shareCode: typeof student.shareCode === 'string' ? student.shareCode.trim() || undefined : undefined,
        })
      }
      return
    }

    if (candidate.type === 'workout.save') {
      const payloadStudentId = candidate.payload?.studentId
      if (typeof payloadStudentId === 'string' && payloadStudentId.trim()) {
        empty.pendingWorkoutSaveIds.add(payloadStudentId.trim())
      }
      return
    }

    if (candidate.type === 'student.delete') {
      const payloadStudentId = candidate.payload?.studentId
      if (typeof payloadStudentId === 'string' && payloadStudentId.trim()) {
        empty.pendingDeleteIds.add(payloadStudentId.trim())
      }
    }
  })

  return empty
}
