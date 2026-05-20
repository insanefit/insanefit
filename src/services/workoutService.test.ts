import { describe, it, expect } from 'vitest'
import { sanitizeWorkoutPayload } from './workoutService'
import type { Exercise } from '../types/trainer'

describe('sanitizeWorkoutPayload', () => {
  it('accepts valid exercises', () => {
    const exercises: Exercise[] = [
      { name: 'Supino Reto', sets: '3x10', note: 'RPE 8' },
      { name: 'Leg Press', sets: '4x12', note: '' },
    ]
    const result = sanitizeWorkoutPayload(exercises)
    expect(result.ok).toBe(true)
    expect(result.payload).toHaveLength(2)
    expect(result.payload[0].name).toBe('Supino Reto')
  })

  it('rejects exercise without name', () => {
    const exercises: Exercise[] = [
      { name: '', sets: '3x10', note: '' },
    ]
    const result = sanitizeWorkoutPayload(exercises)
    expect(result.ok).toBe(false)
    expect(result.message).toContain('nome')
  })

  it('rejects exercise without sets', () => {
    const exercises: Exercise[] = [
      { name: 'Supino', sets: '', note: '' },
    ]
    const result = sanitizeWorkoutPayload(exercises)
    expect(result.ok).toBe(false)
  })

  it('rejects more than 250 exercises', () => {
    const exercises: Exercise[] = Array.from({ length: 251 }, (_, i) => ({
      name: `Ex ${i}`,
      sets: '3x10',
      note: '',
    }))
    const result = sanitizeWorkoutPayload(exercises)
    expect(result.ok).toBe(false)
    expect(result.message).toContain('250')
  })

  it('truncates long values', () => {
    const exercises: Exercise[] = [
      { name: 'A'.repeat(300), sets: 'B'.repeat(200), note: 'C'.repeat(6000) },
    ]
    const result = sanitizeWorkoutPayload(exercises)
    expect(result.ok).toBe(true)
    expect(result.payload[0].name).toHaveLength(180)
    expect(result.payload[0].sets).toHaveLength(120)
    expect(result.payload[0].note).toHaveLength(5000)
  })

  it('handles empty array', () => {
    const result = sanitizeWorkoutPayload([])
    expect(result.ok).toBe(true)
    expect(result.payload).toEqual([])
  })

  it('normalizes day and routine', () => {
    const exercises: Exercise[] = [
      { name: 'Supino', sets: '3x10', note: '', day: '  Segunda  ', routine: '  A  ' },
    ]
    const result = sanitizeWorkoutPayload(exercises)
    expect(result.ok).toBe(true)
    expect(result.payload[0].day).toBe('Segunda')
    expect(result.payload[0].routine).toBe('A')
  })
})
