import { describe, expect, it } from 'vitest'
import type { Exercise } from '../types/trainer'
import {
  buildWorkoutNote,
  createDefaultProtocol,
  parseWorkoutProtocolFromExercise,
} from './workoutProtocol'

describe('workoutProtocol', () => {
  it('cria protocolo padrao com campos de cluster e myo desativados', () => {
    const protocol = createDefaultProtocol('Peito')

    expect(protocol.useClusterSet).toBe(false)
    expect(protocol.clusterBlocks).toBe('3')
    expect(protocol.clusterReps).toBe('2-3')
    expect(protocol.clusterRest).toBe('20s')
    expect(protocol.useMyoReps).toBe(false)
  })

  it('serializa nota com cluster e myo quando ativos', () => {
    const note = buildWorkoutNote({
      id: '1',
      name: 'Supino reto',
      day: 'Seg',
      routine: 'A',
      muscleGroup: 'Peito',
      category: 'Forca',
      equipment: 'Barra',
      warmup: '50%x15',
      feederSets: '1',
      feederReps: '6',
      feederRpe: '6',
      workSets: '3',
      workReps: '8',
      workRpe: '8',
      rest: '90s',
      useClusterSet: true,
      clusterBlocks: '3',
      clusterReps: '2',
      clusterRest: '20s',
      useMyoReps: true,
      myoMiniSets: '2',
      myoMiniReps: '4',
      myoRest: '10s',
      note: 'Controle de descida',
    })

    expect(note).toContain('Cluster: ON; blocks=3; reps=2; rest=20s')
    expect(note).toContain('Myo: ON; mini=2; reps=4; rest=10s')
    expect(note).toContain('Obs: Controle de descida')
  })

  it('faz parse de protocolo com cluster set salvo na nota', () => {
    const exercise: Exercise = {
      name: 'Supino inclinado',
      sets: '3 x 8',
      note:
        'Routine: B | Day: Qua | Warm: 40%x12 | Feeder: 1x6 @ RPE 6 | Work: 3x8 @ RPE 8 | Rest: 90s | Cluster: ON; blocks=4; reps=2; rest=15s | Obs: Subida explosiva',
    }

    const parsed = parseWorkoutProtocolFromExercise(exercise, 'Peito')

    expect(parsed.routine).toBe('B')
    expect(parsed.day).toBe('Qua')
    expect(parsed.useClusterSet).toBe(true)
    expect(parsed.clusterBlocks).toBe('4')
    expect(parsed.clusterReps).toBe('2')
    expect(parsed.clusterRest).toBe('15s')
    expect(parsed.note).toBe('Subida explosiva')
  })
})
