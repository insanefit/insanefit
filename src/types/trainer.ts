export type Student = {
  id: string
  name: string
  objective: string
  adherence: number
  streak: number
  nextSession: string
  plan: string
  sex?: string
  trainingLevel?: string
  workoutType?: string
  whatsapp?: string
  monthlyFee?: number
  dueDay?: number
  pixKey?: string
  shareCode?: string
  studentUserId?: string | null
  updatedAt?: string
}

export type Session = {
  id: string
  day: string
  time: string
  studentId: string
  focus: string
  duration: number
  updatedAt?: string
}

export type Exercise = {
  name: string
  sets: string
  note: string
  day?: string
  routine?: string
}

export type WorkoutByStudent = Record<string, Exercise[]>

export type TrainerData = {
  students: Student[]
  sessions: Session[]
  workoutByStudent: WorkoutByStudent
}

export type StudentPortalData = {
  student: Student
  sessions: Session[]
  workout: Exercise[]
  finance?: {
    monthlyFee: number
    dueDay: number
    paymentMethod: 'pix'
    paymentStatus: 'paid' | 'pending' | 'overdue'
    monthRef: string
    lastPaidMonth: string | null
    lastPaidAt: string | null
    pixKey: string
  }
}
