import { describe, it, expect, beforeEach } from 'vitest'
import {
  readStorage,
  writeStorage,
  scopedKey,
  readScopedStorage,
  readStudentMetaMap,
  persistStudentMeta,
  readDeletedStudentFingerprints,
  writeDeletedStudentFingerprints,
  pruneExpiredDeletedStudentFingerprints,
  buildEmptyTrainerData,
  createShareCode,
  normalizeLookup,
  pickString,
  extractMissingColumnFromError,
  isMissingColumnError,
  readQueueInsights,
  loadDoneSessions,
  persistDoneSessions,
  removeStudentFromTrainerData,
  deletedStudentRetentionMs,
  readStorageAsync,
  writeStorageAsync,
  removeStorageAsync,
  migrateLocalStorageToIndexedDB,
} from './storage'

beforeEach(() => {
  localStorage.clear()
})

// ---------------------------------------------------------------------------
// readStorage / writeStorage (Sync & Async)
// ---------------------------------------------------------------------------

describe('readStorage / writeStorage', () => {
  it('returns null for missing key', () => {
    expect(readStorage('missing')).toBeNull()
  })

  it('round-trips JSON', () => {
    writeStorage('key', { a: 1 })
    expect(readStorage<{ a: number }>('key')).toEqual({ a: 1 })
  })

  it('returns null for corrupted JSON', () => {
    localStorage.setItem('bad', '{not valid json')
    expect(readStorage('bad')).toBeNull()
  })

  it('round-trips JSON asynchronously', async () => {
    await writeStorageAsync('async-key', { val: 42 })
    const result = await readStorageAsync<{ val: number }>('async-key')
    expect(result).toEqual({ val: 42 })
  })

  it('removes key asynchronously', async () => {
    await writeStorageAsync('to-remove', { x: 1 })
    await removeStorageAsync('to-remove')
    const result = await readStorageAsync('to-remove')
    expect(result).toBeNull()
  })
})

describe('migrateLocalStorageToIndexedDB', () => {
  it('migrates legacy localStorage keys gracefully', async () => {
    localStorage.setItem('insanefit:data:v1:user1', JSON.stringify({ migrated: true }))
    const success = await migrateLocalStorageToIndexedDB()
    expect(success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// scopedKey
// ---------------------------------------------------------------------------

describe('scopedKey', () => {
  it('returns base when no userId', () => {
    expect(scopedKey('base')).toBe('base')
  })

  it('appends userId', () => {
    expect(scopedKey('base', 'user1')).toBe('base:user1')
  })
})

// ---------------------------------------------------------------------------
// readScopedStorage (legacy migration)
// ---------------------------------------------------------------------------

describe('readScopedStorage', () => {
  it('reads from current key', () => {
    writeStorage('current:u1', [1, 2])
    expect(readScopedStorage<number[]>('current', 'legacy', 'u1')).toEqual([1, 2])
  })

  it('migrates from legacy key and removes legacy', () => {
    writeStorage('legacy:u1', [3, 4])
    const result = readScopedStorage<number[]>('current', 'legacy', 'u1')
    expect(result).toEqual([3, 4])
    expect(readStorage('current:u1')).toEqual([3, 4])
    expect(localStorage.getItem('legacy:u1')).toBeNull()
  })

  it('returns null when both are empty', () => {
    expect(readScopedStorage('a', 'b', 'u')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Student meta
// ---------------------------------------------------------------------------

describe('persistStudentMeta', () => {
  it('writes whatsapp', () => {
    persistStudentMeta('s1', { whatsapp: '11999' }, 'u1')
    const map = readStudentMetaMap('u1')
    expect(map.s1?.whatsapp).toBe('11999')
  })

  it('removes entry when whatsapp is empty', () => {
    persistStudentMeta('s1', { whatsapp: '11999' }, 'u1')
    persistStudentMeta('s1', { whatsapp: '' }, 'u1')
    const map = readStudentMetaMap('u1')
    expect(map.s1).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Deleted student fingerprints
// ---------------------------------------------------------------------------

describe('deleted student fingerprints', () => {
  it('writes and reads back', () => {
    writeDeletedStudentFingerprints([{ id: 's1', removedAt: '2025-01-01T00:00:00Z' }], 'u1')
    const result = readDeletedStudentFingerprints('u1')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('s1')
  })

  it('deduplicates by id', () => {
    writeDeletedStudentFingerprints([
      { id: 's1', removedAt: '2025-01-01T00:00:00Z' },
      { id: 's1', removedAt: '2025-02-01T00:00:00Z' },
    ], 'u1')
    const result = readDeletedStudentFingerprints('u1')
    expect(result).toHaveLength(1)
  })

  it('prunes expired items', () => {
    const old = new Date(Date.now() - deletedStudentRetentionMs - 1000).toISOString()
    const recent = new Date().toISOString()
    writeDeletedStudentFingerprints([
      { id: 'old', removedAt: old },
      { id: 'recent', removedAt: recent },
    ], 'u1')
    pruneExpiredDeletedStudentFingerprints('u1')
    const result = readDeletedStudentFingerprints('u1')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('recent')
  })
})

// ---------------------------------------------------------------------------
// buildEmptyTrainerData
// ---------------------------------------------------------------------------

describe('buildEmptyTrainerData', () => {
  it('returns empty structure', () => {
    const data = buildEmptyTrainerData()
    expect(data.students).toEqual([])
    expect(data.sessions).toEqual([])
    expect(data.workoutByStudent).toEqual({})
  })
})

// ---------------------------------------------------------------------------
// Done sessions
// ---------------------------------------------------------------------------

describe('loadDoneSessions / persistDoneSessions', () => {
  it('returns empty array when no data', () => {
    expect(loadDoneSessions('u1')).toEqual([])
  })

  it('round-trips', () => {
    persistDoneSessions(['s1', 's2'], 'u1')
    expect(loadDoneSessions('u1')).toEqual(['s1', 's2'])
  })
})

// ---------------------------------------------------------------------------
// createShareCode
// ---------------------------------------------------------------------------

describe('createShareCode', () => {
  it('generates 8-char code', () => {
    const code = createShareCode()
    expect(code).toHaveLength(8)
    expect(/^[A-Z0-9]+$/.test(code)).toBe(true)
  })

  it('avoids ambiguous characters', () => {
    for (let i = 0; i < 50; i += 1) {
      const code = createShareCode()
      expect(code).not.toMatch(/[OI01]/)
    }
  })
})

// ---------------------------------------------------------------------------
// normalizeLookup
// ---------------------------------------------------------------------------

describe('normalizeLookup', () => {
  it('lowercases and strips accents', () => {
    expect(normalizeLookup('  Avançado ')).toBe('avancado')
  })
})

// ---------------------------------------------------------------------------
// pickString
// ---------------------------------------------------------------------------

describe('pickString', () => {
  it('picks first non-empty string', () => {
    expect(pickString(null, '', ' hello ', 'world')).toBe('hello')
  })

  it('returns undefined when all empty', () => {
    expect(pickString(null, undefined, '', '  ')).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// extractMissingColumnFromError
// ---------------------------------------------------------------------------

describe('extractMissingColumnFromError', () => {
  it('detects postgres column error', () => {
    const error = { message: 'column "updated_at" of relation "students" does not exist' }
    expect(extractMissingColumnFromError(error)).toBe('updated_at')
  })

  it('detects postgrest column error', () => {
    const error = { message: "Could not find the 'share_code' column of..." }
    expect(extractMissingColumnFromError(error)).toBe('share_code')
  })

  it('returns null for unrelated error', () => {
    expect(extractMissingColumnFromError({ message: 'something else' })).toBeNull()
  })

  it('returns null for non-object', () => {
    expect(extractMissingColumnFromError(null)).toBeNull()
  })
})

describe('isMissingColumnError', () => {
  it('returns true for column errors', () => {
    expect(isMissingColumnError({ message: 'column "x" of relation' })).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// removeStudentFromTrainerData
// ---------------------------------------------------------------------------

describe('removeStudentFromTrainerData', () => {
  it('removes student, sessions and workout', () => {
    const data: Parameters<typeof removeStudentFromTrainerData>[0] = {
      students: [{ id: 's1', name: 'A' }, { id: 's2', name: 'B' }] as Parameters<typeof removeStudentFromTrainerData>[0]['students'],
      sessions: [{ id: 'ss1', studentId: 's1' }, { id: 'ss2', studentId: 's2' }] as Parameters<typeof removeStudentFromTrainerData>[0]['sessions'],
      workoutByStudent: ({ s1: [{ name: 'ex1' }], s2: [{ name: 'ex2' }] } as unknown) as Parameters<typeof removeStudentFromTrainerData>[0]['workoutByStudent'],
    }
    const result = removeStudentFromTrainerData(data, 's1')
    expect(result.students).toHaveLength(1)
    expect(result.sessions).toHaveLength(1)
    expect(result.workoutByStudent.s1).toBeUndefined()
    expect(result.workoutByStudent.s2).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// readQueueInsights
// ---------------------------------------------------------------------------

describe('readQueueInsights', () => {
  it('returns empty insights for no queue', () => {
    const qi = readQueueInsights('u1')
    expect(qi.pendingCreateIds.size).toBe(0)
  })

  it('reads student.create ops', () => {
    writeStorage('insanefit:sync_queue:v1:u1', [
      { type: 'student.create', payload: { student: { id: 's1', name: 'Test' } } },
      { type: 'workout.save', payload: { studentId: 's1' } },
    ])
    const qi = readQueueInsights('u1')
    expect(qi.pendingCreateIds.has('s1')).toBe(true)
    expect(qi.pendingWorkoutSaveIds.has('s1')).toBe(true)
  })

  it('handles malformed queue entries gracefully', () => {
    writeStorage('insanefit:sync_queue:v1:u1', [null, 42, { type: 'student.create' }])
    const qi = readQueueInsights('u1')
    expect(qi.pendingCreateIds.size).toBe(0)
  })
})
