export type WorkoutDraftItem = {
  id: string
  name: string
  day: string
  routine: string
  muscleGroup: string
  category: string
  equipment: string
  warmup: string
  feederSets: string
  feederReps: string
  feederRpe: string
  workSets: string
  workReps: string
  workRpe: string
  rest: string
  useMyoReps: boolean
  myoMiniSets: string
  myoMiniReps: string
  myoRest: string
  note: string
}

export type WorkoutDraftEditableField = Exclude<keyof WorkoutDraftItem, 'id'>

export type ProgressHistoryEntry = {
  id: string
  date: string
  score: number
  delta: number
}
