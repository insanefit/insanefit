const telemetryStorageKey = 'insanefit:sync_telemetry:v1'

type SyncOperationType =
  | 'student.create'
  | 'student.update'
  | 'student.delete'
  | 'session.create'
  | 'session.update'
  | 'workout.save'

type TelemetryEvent = {
  at: string
  kind: 'enqueue' | 'flush'
  message: string
}

export type SyncTelemetrySnapshot = {
  updatedAt: string
  totalEnqueued: number
  totalFlushRuns: number
  totalProcessed: number
  totalFailed: number
  totalSkipped: number
  consecutiveFailedFlushes: number
  lastQueueSize: number
  lastFlushAt: string | null
  lastFlushDurationMs: number | null
  lastConflictAt: string | null
  lastFailureAt: string | null
  recentEvents: TelemetryEvent[]
}

type FlushInput = {
  userId: string
  processed: number
  failed: number
  skipped: number
  remaining: number
  durationMs: number
}

const scopedKey = (userId: string) => `${telemetryStorageKey}:${userId}`

const buildDefaultSnapshot = (): SyncTelemetrySnapshot => ({
  updatedAt: new Date(0).toISOString(),
  totalEnqueued: 0,
  totalFlushRuns: 0,
  totalProcessed: 0,
  totalFailed: 0,
  totalSkipped: 0,
  consecutiveFailedFlushes: 0,
  lastQueueSize: 0,
  lastFlushAt: null,
  lastFlushDurationMs: null,
  lastConflictAt: null,
  lastFailureAt: null,
  recentEvents: [],
})

const readSnapshot = (userId: string): SyncTelemetrySnapshot => {
  if (typeof window === 'undefined') return buildDefaultSnapshot()
  try {
    const raw = window.localStorage.getItem(scopedKey(userId))
    if (!raw) return buildDefaultSnapshot()
    const parsed = JSON.parse(raw) as Partial<SyncTelemetrySnapshot>
    return {
      ...buildDefaultSnapshot(),
      ...parsed,
      recentEvents: Array.isArray(parsed.recentEvents)
        ? parsed.recentEvents.slice(0, 25).filter((event) => {
            if (!event || typeof event !== 'object') return false
            const candidate = event as Partial<TelemetryEvent>
            return (
              typeof candidate.at === 'string' &&
              (candidate.kind === 'enqueue' || candidate.kind === 'flush') &&
              typeof candidate.message === 'string'
            )
          })
        : [],
    }
  } catch {
    return buildDefaultSnapshot()
  }
}

const writeSnapshot = (userId: string, snapshot: SyncTelemetrySnapshot): void => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(scopedKey(userId), JSON.stringify(snapshot))
}

const pushEvent = (
  snapshot: SyncTelemetrySnapshot,
  event: TelemetryEvent,
): TelemetryEvent[] => [event, ...snapshot.recentEvents].slice(0, 25)

export const recordSyncEnqueue = (input: {
  userId: string
  queueSize: number
  operationType: SyncOperationType
}): void => {
  const current = readSnapshot(input.userId)
  const now = new Date().toISOString()
  writeSnapshot(input.userId, {
    ...current,
    updatedAt: now,
    totalEnqueued: current.totalEnqueued + 1,
    lastQueueSize: input.queueSize,
    recentEvents: pushEvent(current, {
      at: now,
      kind: 'enqueue',
      message: `${input.operationType} adicionada. Fila: ${input.queueSize}`,
    }),
  })
}

export const recordSyncFlushResult = (input: FlushInput): void => {
  const current = readSnapshot(input.userId)
  const now = new Date().toISOString()
  const hasFailure = input.failed > 0
  const hasConflict = input.skipped > 0

  writeSnapshot(input.userId, {
    ...current,
    updatedAt: now,
    totalFlushRuns: current.totalFlushRuns + 1,
    totalProcessed: current.totalProcessed + input.processed,
    totalFailed: current.totalFailed + input.failed,
    totalSkipped: current.totalSkipped + input.skipped,
    consecutiveFailedFlushes: hasFailure ? current.consecutiveFailedFlushes + 1 : 0,
    lastQueueSize: input.remaining,
    lastFlushAt: now,
    lastFlushDurationMs: input.durationMs,
    lastConflictAt: hasConflict ? now : current.lastConflictAt,
    lastFailureAt: hasFailure ? now : current.lastFailureAt,
    recentEvents: pushEvent(current, {
      at: now,
      kind: 'flush',
      message: `flush +${input.processed} • ~${input.skipped} • !${input.failed} • fila ${input.remaining}`,
    }),
  })
}

export const getSyncTelemetrySnapshot = (userId: string): SyncTelemetrySnapshot => readSnapshot(userId)
