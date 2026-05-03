import { getExerciseCoachCue } from '../data/exerciseLibrary'
import { findLibraryExerciseByName } from './exerciseUtils'
import type { Exercise } from '../types/trainer'
import type { WorkoutDraftItem } from '../types/workout'

const workoutDayAliases: Record<string, string> = {
  seg: 'Seg',
  segunda: 'Seg',
  'segunda-feira': 'Seg',
  ter: 'Ter',
  terca: 'Ter',
  terça: 'Ter',
  'terca-feira': 'Ter',
  'terça-feira': 'Ter',
  qua: 'Qua',
  quarta: 'Qua',
  'quarta-feira': 'Qua',
  qui: 'Qui',
  quinta: 'Qui',
  'quinta-feira': 'Qui',
  sex: 'Sex',
  sexta: 'Sex',
  'sexta-feira': 'Sex',
  sab: 'Sab',
  sábado: 'Sab',
  sabado: 'Sab',
  domingo: 'Dom',
  dom: 'Dom',
}

const normalizeLookup = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

export const normalizeWorkoutDay = (value: string): string => workoutDayAliases[normalizeLookup(value)] ?? ''

export const normalizeWorkoutRoutine = (value: string): string => {
  const cleaned = value.trim().toUpperCase()
  if (!cleaned) return 'A'
  return cleaned.slice(0, 12)
}

export const createDefaultProtocol = (muscleGroup: string) => ({
  day: '',
  routine: 'A',
  warmup: '50%x15, 65%x10',
  feederSets: '1',
  feederReps: '6-8',
  feederRpe: '6-7',
  workSets: '2',
  workReps: '8-12',
  workRpe: '8-9',
  rest: '90s',
  useClusterSet: false,
  clusterBlocks: '3',
  clusterReps: '2-3',
  clusterRest: '20s',
  useMyoReps: false,
  myoMiniSets: '3',
  myoMiniReps: '3-5',
  myoRest: '5s',
  note: getExerciseCoachCue(muscleGroup),
})

export const parseSetsAndReps = (value: string): { sets: string; reps: string } => {
  const normalized = value.trim()
  const match = normalized.match(/^(\d+)\s*x\s*(.+)$/i)

  if (!match) {
    return {
      sets: normalized || '3',
      reps: '10-12',
    }
  }

  return {
    sets: match[1],
    reps: match[2],
  }
}

export const parseLegacyRestAndNote = (value: string): { rest: string; note: string } => {
  const normalized = value.trim()
  const match = normalized.match(/^descanso:\s*([^.]+)\.?\s*(.*)$/i)
  const inferredRest = normalized.match(
    /\b(?:rest|descanso|pausa)\s*:?\s*([0-9]+(?:\s*(?:h|hr|m|min|s|seg|sec))?(?:\s*[0-9]+\s*s)?)/i,
  )

  if (!match) {
    return { rest: inferredRest?.[1]?.trim() || '60s', note: normalized }
  }

  return {
    rest: match[1].trim() || '60s',
    note: match[2].trim(),
  }
}

export const parseSetPrescription = (value: string): { sets: string; reps: string; rpe: string } | null => {
  const normalized = value.trim()
  const cleaned = normalized.split('.').shift()?.trim() ?? normalized
  const match = cleaned.match(/(\d+)\s*x\s*([^@|]+?)(?:\s*@\s*rpe\s*([0-9.,/-]+))?$/i)

  if (!match) {
    return null
  }

  return {
    sets: match[1].trim(),
    reps: match[2].trim(),
    rpe: match[3]?.trim() ?? '',
  }
}

export const parseMyoSegment = (
  rawValue: string,
): Partial<Pick<WorkoutDraftItem, 'useMyoReps' | 'myoMiniSets' | 'myoMiniReps' | 'myoRest'>> => {
  const value = rawValue.trim()
  const lower = value.toLowerCase()
  const parsed: Partial<Pick<WorkoutDraftItem, 'useMyoReps' | 'myoMiniSets' | 'myoMiniReps' | 'myoRest'>> = {}

  if (/(on|sim|ativo|ativado)/i.test(lower)) {
    parsed.useMyoReps = true
  }

  if (/(off|nao|não|desativado)/i.test(lower)) {
    parsed.useMyoReps = false
  }

  const miniSets = value.match(/mini(?:-?sets?)?\s*[=:]?\s*([\d-]+)/i)
  if (miniSets) {
    parsed.myoMiniSets = miniSets[1].trim()
    parsed.useMyoReps = true
  }

  const miniReps = value.match(/(?:mini-?)?reps?\s*[=:]?\s*([\d-]+)/i)
  if (miniReps) {
    parsed.myoMiniReps = miniReps[1].trim()
    parsed.useMyoReps = true
  }

  const myoRest = value.match(/(?:rest|descanso)\s*[=:]?\s*([\w: ]+)/i)
  if (myoRest) {
    parsed.myoRest = myoRest[1].trim()
    parsed.useMyoReps = true
  }

  return parsed
}

export const parseClusterSegment = (
  rawValue: string,
): Partial<Pick<WorkoutDraftItem, 'useClusterSet' | 'clusterBlocks' | 'clusterReps' | 'clusterRest'>> => {
  const value = rawValue.trim()
  const lower = value.toLowerCase()
  const parsed: Partial<Pick<WorkoutDraftItem, 'useClusterSet' | 'clusterBlocks' | 'clusterReps' | 'clusterRest'>> =
    {}

  if (/(on|sim|ativo|ativado)/i.test(lower)) {
    parsed.useClusterSet = true
  }

  if (/(off|nao|não|desativado)/i.test(lower)) {
    parsed.useClusterSet = false
  }

  const blocks = value.match(/(?:blocks?|blocos?)\s*[=:]?\s*([\d-]+)/i)
  if (blocks) {
    parsed.clusterBlocks = blocks[1].trim()
    parsed.useClusterSet = true
  }

  const reps = value.match(/(?:reps?|repeticoes|repetições)\s*[=:]?\s*([\d-]+)/i)
  if (reps) {
    parsed.clusterReps = reps[1].trim()
    parsed.useClusterSet = true
  }

  const rest = value.match(/(?:rest|descanso)\s*[=:]?\s*([\w: ]+)/i)
  if (rest) {
    parsed.clusterRest = rest[1].trim()
    parsed.useClusterSet = true
  }

  return parsed
}

export const parseWorkoutProtocolFromExercise = (
  exercise: Exercise,
  muscleGroup: string,
): Omit<WorkoutDraftItem, 'id' | 'name' | 'muscleGroup' | 'category' | 'equipment'> => {
  const defaults = createDefaultProtocol(muscleGroup)
  const parsedSets = parseSetsAndReps(exercise.sets)
  const fromLegacy = parseLegacyRestAndNote(exercise.note)
  const fallback = {
    ...defaults,
    day: normalizeWorkoutDay(exercise.day ?? ''),
    routine: normalizeWorkoutRoutine(exercise.routine ?? ''),
    workSets: parsedSets.sets || defaults.workSets,
    workReps: parsedSets.reps || defaults.workReps,
    rest: fromLegacy.rest || defaults.rest,
    note: fromLegacy.note || defaults.note,
  }

  const segments = exercise.note
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)

  const protocol = { ...fallback }
  const freeNotes: string[] = []

  segments.forEach((segment) => {
    const lower = segment.toLowerCase()
    const segmentValue = segment.slice(segment.indexOf(':') + 1).trim()

    if (lower.startsWith('warm:') || lower.startsWith('warm-up:')) {
      protocol.warmup = segmentValue || protocol.warmup
      return
    }

    if (lower.startsWith('feeder:')) {
      const parsed = parseSetPrescription(segmentValue)
      if (parsed) {
        protocol.feederSets = parsed.sets
        protocol.feederReps = parsed.reps
        protocol.feederRpe = parsed.rpe || protocol.feederRpe
      }
      return
    }

    if (lower.startsWith('work:')) {
      const parsed = parseSetPrescription(segmentValue)
      if (parsed) {
        protocol.workSets = parsed.sets
        protocol.workReps = parsed.reps
        protocol.workRpe = parsed.rpe || protocol.workRpe
      }
      return
    }

    if (lower.startsWith('rest:') || lower.startsWith('descanso:')) {
      const parsedRest = segmentValue.match(/^([^.,|]+)/)
      if (parsedRest?.[1]) {
        protocol.rest = parsedRest[1].trim()
      }

      const remainder = segmentValue
        .slice(parsedRest?.[0]?.length ?? 0)
        .replace(/^[.\s-]+/, '')
        .trim()

      if (remainder) {
        freeNotes.push(remainder)
      }
      return
    }

    if (lower.startsWith('myo:') || lower.startsWith('myo-reps:')) {
      Object.assign(protocol, parseMyoSegment(segmentValue))
      return
    }

    if (lower.startsWith('cluster:') || lower.startsWith('cluster-set:')) {
      Object.assign(protocol, parseClusterSegment(segmentValue))
      return
    }

    if (lower.startsWith('obs:') || lower.startsWith('nota:')) {
      protocol.note = segmentValue || protocol.note
      return
    }

    if (lower.startsWith('day:') || lower.startsWith('dia:')) {
      const normalizedDay = normalizeWorkoutDay(segmentValue)
      protocol.day = normalizedDay || protocol.day
      return
    }

    if (lower.startsWith('routine:') || lower.startsWith('rotina:') || lower.startsWith('treino:')) {
      const normalizedRoutine = normalizeWorkoutRoutine(segmentValue)
      protocol.routine = normalizedRoutine || protocol.routine
      return
    }

    freeNotes.push(segment)
  })

  if (/\bmyo\b/i.test(exercise.note)) {
    protocol.useMyoReps = true
  }

  if (/\bcluster\b/i.test(exercise.note)) {
    protocol.useClusterSet = true
  }

  if (freeNotes.length > 0) {
    protocol.note = freeNotes.join(' | ')
  }

  return protocol
}

export const getExerciseRestPreset = (exercise: Exercise): string => {
  const fromProtocol = exercise.note.match(/\b(?:rest|descanso):\s*([^|.]+)/i)
  if (fromProtocol?.[1]) {
    return fromProtocol[1].trim()
  }

  return parseLegacyRestAndNote(exercise.note).rest
}

export const buildWorkoutNote = (item: WorkoutDraftItem): string => {
  const day = normalizeWorkoutDay(item.day)
  const routine = normalizeWorkoutRoutine(item.routine)
  const warmup = item.warmup.trim() || '50%x15, 65%x10'
  const feederSets = item.feederSets.trim() || '1'
  const feederReps = item.feederReps.trim() || '6-8'
  const feederRpe = item.feederRpe.trim() || '6-7'
  const workSets = item.workSets.trim() || '2'
  const workReps = item.workReps.trim() || '8-12'
  const workRpe = item.workRpe.trim() || '8-9'
  const rest = item.rest.trim() || '90s'
  const note = item.note.trim()
  const clusterBlocks = item.clusterBlocks.trim() || '3'
  const clusterReps = item.clusterReps.trim() || '2-3'
  const clusterRest = item.clusterRest.trim() || '20s'
  const myoMiniSets = item.myoMiniSets.trim() || '3'
  const myoMiniReps = item.myoMiniReps.trim() || '3-5'
  const myoRest = item.myoRest.trim() || '5s'

  const parts = [
    routine ? `Routine: ${routine}` : '',
    day ? `Day: ${day}` : '',
    `Warm: ${warmup}`,
    `Feeder: ${feederSets}x${feederReps} @ RPE ${feederRpe}`,
    `Work: ${workSets}x${workReps} @ RPE ${workRpe}`,
    `Rest: ${rest}`,
  ].filter(Boolean)

  if (item.useMyoReps) {
    parts.push(`Myo: ON; mini=${myoMiniSets}; reps=${myoMiniReps}; rest=${myoRest}`)
  }

  if (item.useClusterSet) {
    parts.push(`Cluster: ON; blocks=${clusterBlocks}; reps=${clusterReps}; rest=${clusterRest}`)
  }

  if (note) {
    parts.push(`Obs: ${note}`)
  }

  return parts.join(' | ')
}

export const workoutToDraft = (studentId: string, workout: Exercise[]): WorkoutDraftItem[] =>
  workout.map((exercise, index) => {
    const source = findLibraryExerciseByName(exercise.name)
    const muscleGroup = source?.muscleGroup ?? 'Funcional'
    const parsedProtocol = parseWorkoutProtocolFromExercise(exercise, muscleGroup)

    return {
      id: `${studentId}-draft-${index}`,
      name: exercise.name,
      day: normalizeWorkoutDay(exercise.day ?? parsedProtocol.day),
      routine: normalizeWorkoutRoutine(exercise.routine ?? parsedProtocol.routine),
      muscleGroup,
      category: source?.category ?? 'Personalizado',
      equipment: source?.equipment ?? 'Livre',
      warmup: parsedProtocol.warmup,
      feederSets: parsedProtocol.feederSets,
      feederReps: parsedProtocol.feederReps,
      feederRpe: parsedProtocol.feederRpe,
      workSets: parsedProtocol.workSets,
      workReps: parsedProtocol.workReps,
      workRpe: parsedProtocol.workRpe,
      rest: parsedProtocol.rest,
      useClusterSet: parsedProtocol.useClusterSet,
      clusterBlocks: parsedProtocol.clusterBlocks,
      clusterReps: parsedProtocol.clusterReps,
      clusterRest: parsedProtocol.clusterRest,
      useMyoReps: parsedProtocol.useMyoReps,
      myoMiniSets: parsedProtocol.myoMiniSets,
      myoMiniReps: parsedProtocol.myoMiniReps,
      myoRest: parsedProtocol.myoRest,
      note: parsedProtocol.note || getExerciseCoachCue(muscleGroup),
    }
  })

export const draftToWorkout = (draft: WorkoutDraftItem[]): Exercise[] =>
  draft.map((item) => ({
    name: item.name,
    sets: `${item.workSets.trim() || '2'} x ${item.workReps.trim() || '8-12'}`,
    note: buildWorkoutNote(item),
    day: normalizeWorkoutDay(item.day),
    routine: normalizeWorkoutRoutine(item.routine),
  }))
