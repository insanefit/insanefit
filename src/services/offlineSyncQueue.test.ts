import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session, Student } from '../types/trainer'

const supabaseMocks = vi.hoisted(() => {
  const maybeSingle = vi.fn()
  const eqSecond = vi.fn(() => ({ maybeSingle }))
  const eqFirst = vi.fn(() => ({ eq: eqSecond }))
  const select = vi.fn(() => ({ eq: eqFirst }))
  const from = vi.fn(() => ({ select }))

  return {
    maybeSingle,
    eqSecond,
    eqFirst,
    select,
    from,
    supabase: { from },
  }
})

const trainerStoreMocks = vi.hoisted(() => ({
  saveExercisesRemotely: vi.fn(),
  saveSessionRemotely: vi.fn(),
  saveStudentRemotely: vi.fn(),
  saveStudentWorkoutAtomicallyRemotely: vi.fn(),
  updateSessionRemotely: vi.fn(),
  updateStudentRemotely: vi.fn(),
}))

vi.mock('../lib/supabase', () => ({
  hasSupabaseCredentials: true,
  supabase: supabaseMocks.supabase,
}))

vi.mock('./trainerStore', () => trainerStoreMocks)

import {
  enqueueSyncOperation,
  flushSyncQueue,
  getSyncQueueCount,
} from './offlineSyncQueue'
import { getSyncTelemetrySnapshot } from './syncTelemetryStore'

describe('offlineSyncQueue', () => {
  const userId = 'trainer-test'

  beforeEach(() => {
    globalThis.localStorage.clear()
    supabaseMocks.maybeSingle.mockReset()
    supabaseMocks.eqSecond.mockClear()
    supabaseMocks.eqFirst.mockClear()
    supabaseMocks.select.mockClear()
    supabaseMocks.from.mockClear()

    trainerStoreMocks.saveExercisesRemotely.mockReset()
    trainerStoreMocks.saveSessionRemotely.mockReset()
    trainerStoreMocks.saveStudentRemotely.mockReset()
    trainerStoreMocks.saveStudentWorkoutAtomicallyRemotely.mockReset()
    trainerStoreMocks.updateSessionRemotely.mockReset()
    trainerStoreMocks.updateStudentRemotely.mockReset()

    supabaseMocks.maybeSingle.mockResolvedValue({ data: null, error: null })
  })

  it('deduplica operacao por tipo e entidade', () => {
    const student: Student = {
      id: 's1',
      name: 'Aluno 1',
      objective: 'Hipertrofia',
      adherence: 70,
      streak: 0,
      nextSession: 'Masculino',
      plan: 'Iniciante',
      sex: 'Masculino',
      trainingLevel: 'Iniciante',
      workoutType: 'Hipertrofia',
    }

    const count1 = enqueueSyncOperation({ type: 'student.update', userId, student })
    const count2 = enqueueSyncOperation({ type: 'student.update', userId, student })

    expect(count1).toBe(1)
    expect(count2).toBe(1)
    expect(getSyncQueueCount(userId)).toBe(1)
    const telemetry = getSyncTelemetrySnapshot(userId)
    expect(telemetry.totalEnqueued).toBe(2)
    expect(telemetry.lastQueueSize).toBe(1)
  })

  it('processa fila com sucesso e limpa pendencias', async () => {
    const session: Session = {
      id: 'session-1',
      day: 'seg',
      time: '07:00',
      studentId: 's1',
      focus: 'Peito',
      duration: 60,
    }
    trainerStoreMocks.saveSessionRemotely.mockResolvedValue(true)

    enqueueSyncOperation({ type: 'session.create', userId, session })
    const result = await flushSyncQueue(userId)

    expect(trainerStoreMocks.saveSessionRemotely).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      processed: 1,
      failed: 0,
      skipped: 0,
      remaining: 0,
    })
    expect(getSyncQueueCount(userId)).toBe(0)
    const telemetry = getSyncTelemetrySnapshot(userId)
    expect(telemetry.totalFlushRuns).toBe(1)
    expect(telemetry.totalProcessed).toBe(1)
    expect(telemetry.consecutiveFailedFlushes).toBe(0)
  })

  it('mantem na fila quando operacao falha', async () => {
    const student: Student = {
      id: 's2',
      name: 'Aluno 2',
      objective: 'Resistencia',
      adherence: 60,
      streak: 1,
      nextSession: 'Feminino',
      plan: 'Intermediario',
      sex: 'Feminino',
      trainingLevel: 'Intermediario',
      workoutType: 'Resistencia',
      updatedAt: '2026-05-03T10:00:00.000Z',
    }
    trainerStoreMocks.updateStudentRemotely.mockResolvedValue(false)

    enqueueSyncOperation({ type: 'student.update', userId, student, localUpdatedAt: student.updatedAt })
    const result = await flushSyncQueue(userId)

    expect(trainerStoreMocks.updateStudentRemotely).toHaveBeenCalledTimes(1)
    expect(result.failed).toBe(1)
    expect(result.remaining).toBe(1)
    expect(getSyncQueueCount(userId)).toBe(1)
    const telemetry = getSyncTelemetrySnapshot(userId)
    expect(telemetry.totalFailed).toBe(1)
    expect(telemetry.consecutiveFailedFlushes).toBe(1)
  })

  it('descarta update local antigo quando remoto ja e mais novo', async () => {
    const student: Student = {
      id: 's3',
      name: 'Aluno 3',
      objective: 'Forca',
      adherence: 88,
      streak: 3,
      nextSession: 'Masculino',
      plan: 'Avancado',
      sex: 'Masculino',
      trainingLevel: 'Avancado',
      workoutType: 'Forca',
      updatedAt: '2026-05-03T10:00:00.000Z',
    }

    supabaseMocks.maybeSingle.mockResolvedValue({
      data: { updated_at: '2026-05-03T10:30:00.000Z' },
      error: null,
    })
    trainerStoreMocks.updateStudentRemotely.mockResolvedValue(true)

    enqueueSyncOperation({ type: 'student.update', userId, student, localUpdatedAt: student.updatedAt })
    const result = await flushSyncQueue(userId)

    expect(trainerStoreMocks.updateStudentRemotely).not.toHaveBeenCalled()
    expect(result).toEqual({
      processed: 0,
      failed: 0,
      skipped: 1,
      remaining: 0,
    })
    expect(getSyncQueueCount(userId)).toBe(0)
    const telemetry = getSyncTelemetrySnapshot(userId)
    expect(telemetry.totalSkipped).toBe(1)
    expect(telemetry.lastConflictAt).not.toBeNull()
  })
})
