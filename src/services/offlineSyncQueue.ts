import type { Exercise, Session, Student } from '../types/trainer'
import { hasSupabaseCredentials, supabase } from '../lib/supabase'
import {
  deleteStudentRemotely,
  saveExercisesRemotely,
  saveSessionRemotely,
  saveStudentRemotely,
  saveStudentWorkoutAtomicallyRemotely,
  updateSessionRemotely,
  updateStudentRemotely,
} from './trainerStore'
import { recordSyncEnqueue, recordSyncFlushResult } from './syncTelemetryStore'

const queueStorageKey = 'insanefit:sync_queue:v1'

export type SyncOperationType =
  | 'student.create'
  | 'student.update'
  | 'student.delete'
  | 'session.create'
  | 'session.update'
  | 'workout.save'

type BaseSyncOperation = {
  id: string
  type: SyncOperationType
  userId: string
  localUpdatedAt: string
  queuedAt: string
}

type StudentCreateOperation = BaseSyncOperation & {
  type: 'student.create'
  payload: {
    student: Student
    starterExercises: Exercise[]
  }
}

type StudentUpdateOperation = BaseSyncOperation & {
  type: 'student.update'
  payload: {
    student: Student
  }
}

type StudentDeleteOperation = BaseSyncOperation & {
  type: 'student.delete'
  payload: {
    studentId: string
    shareCode?: string
    name?: string
  }
}

type SessionCreateOperation = BaseSyncOperation & {
  type: 'session.create'
  payload: {
    session: Session
  }
}

type SessionUpdateOperation = BaseSyncOperation & {
  type: 'session.update'
  payload: {
    session: Session
  }
}

type WorkoutSaveOperation = BaseSyncOperation & {
  type: 'workout.save'
  payload: {
    studentId: string
    workout: Exercise[]
  }
}

export type SyncQueueOperation =
  | StudentCreateOperation
  | StudentUpdateOperation
  | StudentDeleteOperation
  | SessionCreateOperation
  | SessionUpdateOperation
  | WorkoutSaveOperation

type EnqueueInput =
  | {
      type: 'student.create'
      userId: string
      student: Student
      starterExercises: Exercise[]
      localUpdatedAt?: string
    }
  | {
      type: 'student.update'
      userId: string
      student: Student
      localUpdatedAt?: string
    }
  | {
      type: 'student.delete'
      userId: string
      studentId: string
      shareCode?: string
      name?: string
      localUpdatedAt?: string
    }
  | {
      type: 'session.create'
      userId: string
      session: Session
      localUpdatedAt?: string
    }
  | {
      type: 'session.update'
      userId: string
      session: Session
      localUpdatedAt?: string
    }
  | {
      type: 'workout.save'
      userId: string
      studentId: string
      workout: Exercise[]
      localUpdatedAt?: string
    }

export type FlushResult = {
  processed: number
  failed: number
  skipped: number
  remaining: number
}

const scopedKey = (userId: string) => `${queueStorageKey}:${userId}`

const parseTimestamp = (value: string | null | undefined): number | null => {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

const readQueue = (userId: string): SyncQueueOperation[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(scopedKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as SyncQueueOperation[]) : []
  } catch {
    return []
  }
}

const writeQueue = (userId: string, queue: SyncQueueOperation[]) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(scopedKey(userId), JSON.stringify(queue))
}

const getOperationEntityKey = (operation: SyncQueueOperation): string => {
  switch (operation.type) {
    case 'student.create':
    case 'student.update':
      return operation.payload.student.id
    case 'student.delete':
      return operation.payload.studentId
    case 'session.create':
    case 'session.update':
      return operation.payload.session.id
    case 'workout.save':
      return operation.payload.studentId
  }
}

const dedupeQueue = (queue: SyncQueueOperation[], incoming: SyncQueueOperation): SyncQueueOperation[] => {
  const entityKey = getOperationEntityKey(incoming)
  const deduped = queue.filter((item) => {
    if (item.type !== incoming.type) return true
    return getOperationEntityKey(item) !== entityKey
  })
  return [...deduped, incoming]
}

const buildQueueOperation = (input: EnqueueInput): SyncQueueOperation => {
  const queuedAt = new Date().toISOString()
  const localUpdatedAt = input.localUpdatedAt ?? queuedAt
  const id = `${input.type}:${localUpdatedAt}:${Math.random().toString(36).slice(2, 9)}`

  switch (input.type) {
    case 'student.create':
      return {
        id,
        type: input.type,
        userId: input.userId,
        localUpdatedAt,
        queuedAt,
        payload: { student: input.student, starterExercises: input.starterExercises },
      }
    case 'student.update':
      return {
        id,
        type: input.type,
        userId: input.userId,
        localUpdatedAt,
        queuedAt,
        payload: { student: input.student },
      }
    case 'student.delete':
      return {
        id,
        type: input.type,
        userId: input.userId,
        localUpdatedAt,
        queuedAt,
        payload: {
          studentId: input.studentId,
          shareCode: input.shareCode?.trim() || undefined,
          name: input.name?.trim() || undefined,
        },
      }
    case 'session.create':
      return {
        id,
        type: input.type,
        userId: input.userId,
        localUpdatedAt,
        queuedAt,
        payload: { session: input.session },
      }
    case 'session.update':
      return {
        id,
        type: input.type,
        userId: input.userId,
        localUpdatedAt,
        queuedAt,
        payload: { session: input.session },
      }
    case 'workout.save':
      return {
        id,
        type: input.type,
        userId: input.userId,
        localUpdatedAt,
        queuedAt,
        payload: { studentId: input.studentId, workout: input.workout },
      }
  }
}

const extractRowTimestamp = (row: unknown): number | null => {
  if (!row || typeof row !== 'object') return null
  const candidate = row as Record<string, unknown>
  const updatedAt = parseTimestamp(
    typeof candidate.updated_at === 'string' ? candidate.updated_at : null,
  )
  if (updatedAt !== null) return updatedAt
  return parseTimestamp(typeof candidate.created_at === 'string' ? candidate.created_at : null)
}

const isStaleAgainstRemote = async (input: {
  table: 'students' | 'sessions'
  id: string
  userId: string
  localUpdatedAt: string
}): Promise<boolean> => {
  if (!supabase) return false
  const { data, error } = await supabase
    .from(input.table)
    .select('*')
    .eq('id', input.id)
    .eq('user_id', input.userId)
    .maybeSingle()

  if (error || !data) return false

  const localStamp = parseTimestamp(input.localUpdatedAt)
  const remoteStamp = extractRowTimestamp(data)
  if (localStamp === null || remoteStamp === null) return false
  return localStamp < remoteStamp
}

const processOperation = async (operation: SyncQueueOperation): Promise<'processed' | 'failed' | 'skipped'> => {
  switch (operation.type) {
    case 'student.create': {
      const saved = await saveStudentRemotely(operation.payload.student, operation.userId)
      if (!saved) return 'failed'
      const exercisesSaved = await saveExercisesRemotely(
        operation.payload.student.id,
        operation.payload.starterExercises,
        operation.userId,
      )
      return exercisesSaved ? 'processed' : 'failed'
    }
    case 'student.update': {
      const stale = await isStaleAgainstRemote({
        table: 'students',
        id: operation.payload.student.id,
        userId: operation.userId,
        localUpdatedAt: operation.localUpdatedAt,
      })
      if (stale) return 'skipped'
      const saved = await updateStudentRemotely(operation.payload.student, operation.userId)
      return saved ? 'processed' : 'failed'
    }
    case 'student.delete': {
      const saved = await deleteStudentRemotely(operation.payload.studentId, operation.userId)
      return saved ? 'processed' : 'failed'
    }
    case 'session.create': {
      const saved = await saveSessionRemotely(operation.payload.session, operation.userId)
      return saved ? 'processed' : 'failed'
    }
    case 'session.update': {
      const stale = await isStaleAgainstRemote({
        table: 'sessions',
        id: operation.payload.session.id,
        userId: operation.userId,
        localUpdatedAt: operation.localUpdatedAt,
      })
      if (stale) return 'skipped'
      const saved = await updateSessionRemotely(operation.payload.session, operation.userId)
      return saved ? 'processed' : 'failed'
    }
    case 'workout.save': {
      const stale = await isStaleAgainstRemote({
        table: 'students',
        id: operation.payload.studentId,
        userId: operation.userId,
        localUpdatedAt: operation.localUpdatedAt,
      })
      if (stale) return 'skipped'
      const saved = await saveStudentWorkoutAtomicallyRemotely(
        operation.payload.studentId,
        operation.payload.workout,
        operation.userId,
      )
      return saved.ok ? 'processed' : 'failed'
    }
  }
}

export const enqueueSyncOperation = (input: EnqueueInput): number => {
  const operation = buildQueueOperation(input)
  const queue = readQueue(input.userId)
  const nextQueue = dedupeQueue(queue, operation)
  writeQueue(input.userId, nextQueue)
  recordSyncEnqueue({
    userId: input.userId,
    queueSize: nextQueue.length,
    operationType: input.type,
  })
  return nextQueue.length
}

export const getSyncQueue = (userId: string): SyncQueueOperation[] => readQueue(userId)

export const getSyncQueueCount = (userId: string): number => readQueue(userId).length

const normalizeQueueText = (value: string | undefined): string =>
  (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

export const dropSyncOperationsForStudent = (
  userId: string,
  studentId: string,
  options?: { shareCode?: string; name?: string },
): number => {
  const queue = readQueue(userId)
  if (queue.length === 0) return 0
  const normalizedShareCode = normalizeQueueText(options?.shareCode)
  const normalizedName = normalizeQueueText(options?.name)

  const nextQueue = queue.filter((operation) => {
    if (operation.type === 'student.create' || operation.type === 'student.update') {
      const student = operation.payload.student
      if (student.id === studentId) return false
      if (normalizedShareCode && normalizeQueueText(student.shareCode) === normalizedShareCode) return false
      if (normalizedName && normalizeQueueText(student.name) === normalizedName) return false
      return true
    }
    if (operation.type === 'student.delete') {
      if (operation.payload.studentId === studentId) return false
      if (
        normalizedShareCode &&
        normalizeQueueText(operation.payload.shareCode) === normalizedShareCode
      ) {
        return false
      }
      if (normalizedName && normalizeQueueText(operation.payload.name) === normalizedName) {
        return false
      }
      return true
    }
    if (operation.type === 'workout.save') {
      return operation.payload.studentId !== studentId
    }
    if (operation.type === 'session.create' || operation.type === 'session.update') {
      return operation.payload.session.studentId !== studentId
    }
    return true
  })

  if (nextQueue.length !== queue.length) {
    writeQueue(userId, nextQueue)
  }

  return nextQueue.length
}

export const flushSyncQueue = async (userId: string): Promise<FlushResult> => {
  const startedAt = Date.now()
  if (!userId.trim() || !hasSupabaseCredentials || !supabase) {
    return { processed: 0, failed: 0, skipped: 0, remaining: getSyncQueueCount(userId) }
  }

  const queue = readQueue(userId)
  if (queue.length === 0) {
    return { processed: 0, failed: 0, skipped: 0, remaining: 0 }
  }

  const remaining: SyncQueueOperation[] = []
  let processed = 0
  let failed = 0
  let skipped = 0

  for (const operation of queue) {
    const result = await processOperation(operation)
    if (result === 'processed') {
      processed += 1
      continue
    }
    if (result === 'skipped') {
      skipped += 1
      continue
    }
    failed += 1
    remaining.push(operation)
  }

  writeQueue(userId, remaining)
  const result = { processed, failed, skipped, remaining: remaining.length }
  recordSyncFlushResult({
    userId,
    ...result,
    durationMs: Date.now() - startedAt,
  })
  return result
}
