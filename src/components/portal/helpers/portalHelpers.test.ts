import { describe, it, expect } from 'vitest'
import {
  toPositiveInt,
  splitWarmupBlocks,
  buildEmptySeriesStepExecution,
  isRecord,
  formatDateKey,
  parseNumericMetric,
  formatEffortHint,
  extractTargetReps,
  extractWorkoutDayFromNote,
  extractWorkoutRoutineFromNote,
  extractYoutubeVideoId,
  buildYoutubeThumbCandidates,
  getPortalAccessState,
  normalizeSeriesProgressStore,
  normalizeThumbnailCacheStore,
  buildExerciseSeriesSteps,
} from './portalHelpers'

describe('toPositiveInt', () => {
  it('parses positive int from string', () => {
    expect(toPositiveInt('3', 1)).toBe(3)
  })
  it('clamps to 20', () => {
    expect(toPositiveInt('50', 1)).toBe(20)
  })
  it('returns fallback for empty', () => {
    expect(toPositiveInt('', 5)).toBe(5)
  })
  it('returns fallback for zero', () => {
    expect(toPositiveInt('0', 2)).toBe(2)
  })
})

describe('splitWarmupBlocks', () => {
  it('splits by comma and semicolon', () => {
    expect(splitWarmupBlocks('50%x15, 65%x10; 75%x5')).toEqual(['50%x15', '65%x10', '75%x5'])
  })
  it('returns empty for empty string', () => {
    expect(splitWarmupBlocks('')).toEqual([])
  })
})

describe('buildEmptySeriesStepExecution', () => {
  it('returns default values', () => {
    const exec = buildEmptySeriesStepExecution()
    expect(exec.done).toBe(false)
    expect(exec.load).toBe('')
    expect(exec.reps).toBe('')
  })
})

describe('isRecord', () => {
  it('returns true for plain objects', () => {
    expect(isRecord({})).toBe(true)
  })
  it('returns false for arrays', () => {
    expect(isRecord([])).toBe(false)
  })
  it('returns false for null', () => {
    expect(isRecord(null)).toBe(false)
  })
})

describe('formatDateKey', () => {
  it('formats YYYY-MM-DD', () => {
    expect(formatDateKey(new Date(2025, 0, 5))).toBe('2025-01-05')
  })
})

describe('parseNumericMetric', () => {
  it('parses integer', () => {
    expect(parseNumericMetric('50')).toBe(50)
  })
  it('parses with comma', () => {
    expect(parseNumericMetric('12,5')).toBe(12.5)
  })
  it('returns 0 for non-numeric (strips to empty)', () => {
    expect(parseNumericMetric('abc')).toBe(0)
  })
})

describe('formatEffortHint', () => {
  it('formats RPE', () => {
    expect(formatEffortHint('8')).toBe('esforço 8/10')
  })
  it('returns default for empty', () => {
    expect(formatEffortHint('')).toBe('esforço confortável')
  })
})

describe('extractTargetReps', () => {
  it('extracts reps from detail', () => {
    expect(extractTargetReps({ id: '1', label: 'Série 1', detail: '8 repetições (esforço 8/10)', rest: '90s' })).toBe('8')
  })
  it('returns full detail for warmup', () => {
    expect(extractTargetReps({ id: '1', label: 'Aquecimento 1', detail: '50%x15', rest: '60s' })).toBe('50%x15')
  })
})

describe('extractWorkoutDayFromNote', () => {
  it('extracts day from note', () => {
    const result = extractWorkoutDayFromNote('day: Segunda | routine: A')
    expect(result).toBeTruthy()
  })
  it('returns empty for no match', () => {
    expect(extractWorkoutDayFromNote('some note')).toBe('')
  })
})

describe('extractWorkoutRoutineFromNote', () => {
  it('extracts routine from note', () => {
    expect(extractWorkoutRoutineFromNote('routine: B')).toBe('B')
  })
  it('defaults to A', () => {
    expect(extractWorkoutRoutineFromNote('no match')).toBe('A')
  })
})

describe('extractYoutubeVideoId', () => {
  it('extracts from watch URL', () => {
    expect(extractYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
  it('extracts from embed URL', () => {
    expect(extractYoutubeVideoId('https://youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
  it('extracts from short URL', () => {
    expect(extractYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
  it('extracts from shorts URL', () => {
    expect(extractYoutubeVideoId('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
  it('returns null for non-youtube', () => {
    expect(extractYoutubeVideoId('https://example.com')).toBeNull()
  })
})

describe('buildYoutubeThumbCandidates', () => {
  it('returns 5 candidates', () => {
    expect(buildYoutubeThumbCandidates('abc123')).toHaveLength(5)
  })
  it('prioritizes cached quality', () => {
    const candidates = buildYoutubeThumbCandidates('abc123', 'hqdefault.jpg')
    expect(candidates[0].quality).toBe('hqdefault.jpg')
  })
})

describe('getPortalAccessState', () => {
  it('returns no expiry for undefined', () => {
    expect(getPortalAccessState(undefined).badge).toBe('Sem validade')
  })
  it('returns expired for past date', () => {
    const past = new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0]
    const state = getPortalAccessState(past)
    expect(state.blocked).toBe(true)
    expect(state.badge).toBe('Acesso expirado')
  })
  it('returns active for future date', () => {
    const future = new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
    const state = getPortalAccessState(future)
    expect(state.blocked).toBe(false)
    expect(state.badge).toBe('Acesso ativo')
  })
})

describe('normalizeSeriesProgressStore', () => {
  it('returns empty for non-object', () => {
    expect(normalizeSeriesProgressStore(null)).toEqual({})
  })
  it('normalizes valid nested structure', () => {
    const input = { s1: { ex1: { step1: { done: true, load: '50', reps: '10' } } } }
    const result = normalizeSeriesProgressStore(input)
    expect(result.s1.ex1.step1.done).toBe(true)
    expect(result.s1.ex1.step1.load).toBe('50')
  })
  it('handles boolean legacy format', () => {
    const input = { s1: { ex1: { step1: true } } }
    const result = normalizeSeriesProgressStore(input)
    expect(result.s1.ex1.step1.done).toBe(true)
    expect(result.s1.ex1.step1.load).toBe('')
  })
})

describe('normalizeThumbnailCacheStore', () => {
  it('returns empty for non-object', () => {
    expect(normalizeThumbnailCacheStore(42)).toEqual({})
  })
  it('keeps valid entries', () => {
    const result = normalizeThumbnailCacheStore({ abc: 'hqdefault.jpg', def: '__none__' })
    expect(result.abc).toBe('hqdefault.jpg')
    expect(result.def).toBe('__none__')
  })
})

describe('buildExerciseSeriesSteps', () => {
  it('builds warmup + feeder + work steps', () => {
    const protocol = {
  warmup: '...',
  feederSets: '...',
  feederReps: '...',
  feederRpe: '...',
  workSets: '...',
  workReps: '...',
  workRpe: '...',
  rest: '...',
  useClusterSet: false,
  clusterBlocks: '',
  clusterReps: '',
  clusterRest: '',
  useMyoReps: false,
  myoActivation: '',
  myoMiniSets: '',
  myoRest: '',
  day: 'Seg',
  routine: 'Treino A',
  note: '',
}
    const steps = buildExerciseSeriesSteps('Supino Reto', {
      ...protocol,
      day: 'Seg',
      routine: 'Treino A',
      note: '',
      myoMiniReps: '',
    })
    expect(steps.length).toBe(6) // 1 warmup + 2 feeder + 3 work
    expect(steps[0].label).toContain('Aquecimento')
    expect(steps[1].label).toContain('Preparação')
    expect(steps[3].label).toContain('Série principal')
  })

  it('adds cluster blocks when enabled', () => {
    const protocol = {
  warmup: '...',
  feederSets: '...',
  feederReps: '...',
  feederRpe: '...',
  workSets: '...',
  workReps: '...',
  workRpe: '...',
  rest: '...',
  useClusterSet: false,
  clusterBlocks: '',
  clusterReps: '',
  clusterRest: '',
  useMyoReps: false,
  myoActivation: '',
  myoMiniSets: '',
  myoRest: '',
  day: 'Seg',
  routine: 'Treino A',
  note: '',
}
    const steps = buildExerciseSeriesSteps('Agachamento', {
      ...protocol,
      day: 'Seg',
      routine: 'Treino A',
      note: '',
      myoMiniReps: '',
    })
    // 2 work sets * 3 cluster blocks = 6
    expect(steps.filter((s) => s.label.includes('Cluster'))).toHaveLength(6)
  })
})
