import { z } from 'zod'

export const studentRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  objective: z.string(),
  adherence: z.number(),
  streak: z.number(),
  next_session: z.string(),
  plan: z.string(),
  sex: z.string().nullable().optional(),
  training_level: z.string().nullable().optional(),
  workout_type: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  share_code: z.string().nullable(),
  student_user_id: z.string().nullable(),
})

export const sessionRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  day: z.string(),
  time: z.string(),
  student_id: z.string(),
  focus: z.string(),
  duration: z.number(),
})

export const exerciseRowSchema = z.object({
  user_id: z.string(),
  student_id: z.string(),
  name: z.string(),
  sets: z.string(),
  note: z.string(),
  day: z.string().nullable().optional(),
  routine: z.string().nullable().optional(),
})

export const studentPortalFinanceRowSchema = z.object({
  student_id: z.string(),
  monthly_fee: z.number(),
  due_day: z.number(),
  month_ref: z.string(),
  payment_status: z.enum(['paid', 'pending', 'overdue']),
  last_paid_at: z.string().nullable(),
  pix_key: z.string(),
})

export const studentPaymentSummaryRowSchema = z.object({
  student_id: z.string(),
  monthly_fee: z.number(),
  due_day: z.number(),
})

export const studentPaymentDbRowSchema = z.object({
  student_id: z.string(),
  month_ref: z.string(),
  monthly_fee: z.number(),
  due_day: z.number(),
  payment_method: z.enum(['pix']),
  status: z.enum(['paid', 'pending', 'overdue']),
  last_paid_at: z.string().nullable(),
})

export const trainerProfilePixSchema = z.object({
  pix_key: z.string().nullable(),
})

export const parseRows = <T>(schema: z.ZodType<T>, value: unknown): T[] => {
  const parsed = z.array(schema).safeParse(value)
  return parsed.success ? parsed.data : []
}

export const parseSingle = <T>(schema: z.ZodType<T>, value: unknown): T | null => {
  const parsed = schema.safeParse(value)
  return parsed.success ? parsed.data : null
}
