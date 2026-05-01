import { hasSupabaseCredentials, supabase } from '../lib/supabase'
import type { StudentFinanceSnapshot, StudentPaymentRow, TrainerFinanceSnapshot } from '../types/payment'
import {
  parseRows,
  parseSingle,
  studentPaymentDbRowSchema,
  trainerProfilePixSchema,
} from '../schemas/supabaseSchemas'
import type { z } from 'zod'

const financeStorageKey = 'insanefit:financeiro:v1'
const pixStorageKey = 'insanefit:pix_key:v1'

type StudentPaymentDbRow = z.infer<typeof studentPaymentDbRowSchema>
type TrainerProfilePixRow = z.infer<typeof trainerProfilePixSchema>

const buildStorageKey = (base: string, userId?: string): string =>
  userId ? `${base}:${userId}` : `${base}:anon`

const createDefaultPaymentRow = (): StudentPaymentRow => ({
  monthlyFee: 0,
  dueDay: 10,
  paymentMethod: 'pix',
  lastPaidMonth: null,
  lastPaidAt: null,
})

export const buildCurrentMonthRef = (date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const loadLegacyPaymentMap = (userId?: string): Record<string, StudentPaymentRow> => {
  try {
    const raw = window.localStorage.getItem(buildStorageKey(financeStorageKey, userId))
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, Partial<StudentPaymentRow>>
    const normalized: Record<string, StudentPaymentRow> = {}

    Object.entries(parsed).forEach(([studentId, row]) => {
      const monthlyFee = Number(row.monthlyFee)
      const dueDay = Number(row.dueDay)
      normalized[studentId] = {
        monthlyFee: Number.isFinite(monthlyFee) ? Math.max(0, monthlyFee) : 0,
        dueDay: Number.isFinite(dueDay) ? Math.max(1, Math.min(31, Math.round(dueDay))) : 10,
        paymentMethod: 'pix',
        lastPaidMonth: typeof row.lastPaidMonth === 'string' ? row.lastPaidMonth : null,
        lastPaidAt: typeof row.lastPaidAt === 'string' ? row.lastPaidAt : null,
      }
    })

    return normalized
  } catch {
    return {}
  }
}

const loadLegacyPixKey = (userId?: string): string => {
  try {
    return (window.localStorage.getItem(buildStorageKey(pixStorageKey, userId)) ?? '').trim()
  } catch {
    return ''
  }
}

const mapDbPaymentToUi = (row: StudentPaymentDbRow): StudentPaymentRow => ({
  monthlyFee: Number(row.monthly_fee ?? 0),
  dueDay: Number(row.due_day ?? 10),
  paymentMethod: 'pix',
  lastPaidMonth: row.status === 'paid' ? row.month_ref : null,
  lastPaidAt: row.last_paid_at,
})

export const loadTrainerFinanceSnapshot = async (
  userId: string | undefined,
  studentIds: string[],
): Promise<TrainerFinanceSnapshot> => {
  const monthRef = buildCurrentMonthRef()
  const fallbackMap = loadLegacyPaymentMap(userId)
  const fallbackPix = loadLegacyPixKey(userId)

  if (!hasSupabaseCredentials || !userId || !supabase) {
    const localMap: Record<string, StudentPaymentRow> = {}
    studentIds.forEach((studentId) => {
      localMap[studentId] = fallbackMap[studentId] ?? createDefaultPaymentRow()
    })
    return {
      monthRef,
      pixKey: fallbackPix,
      paymentMap: localMap,
    }
  }

  const [paymentsResponse, profileResponse] = await Promise.all([
    supabase
      .from('student_payments')
      .select('student_id,month_ref,monthly_fee,due_day,payment_method,status,last_paid_at')
      .eq('user_id', userId)
      .eq('month_ref', monthRef),
    supabase
      .from('trainer_profiles')
      .select('pix_key')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  if (paymentsResponse.error || profileResponse.error) {
    const localMap: Record<string, StudentPaymentRow> = {}
    studentIds.forEach((studentId) => {
      localMap[studentId] = fallbackMap[studentId] ?? createDefaultPaymentRow()
    })
    return {
      monthRef,
      pixKey: fallbackPix,
      paymentMap: localMap,
    }
  }

  const dbRows = parseRows(studentPaymentDbRowSchema, paymentsResponse.data ?? [])
  const dbMap = new Map(dbRows.map((row) => [row.student_id, mapDbPaymentToUi(row)]))
  const paymentMap: Record<string, StudentPaymentRow> = {}

  studentIds.forEach((studentId) => {
    paymentMap[studentId] = dbMap.get(studentId) ?? createDefaultPaymentRow()
  })

  return {
    monthRef,
    pixKey: (parseSingle(trainerProfilePixSchema, profileResponse.data) as TrainerProfilePixRow | null)?.pix_key?.trim() ?? '',
    paymentMap,
  }
}

export const saveTrainerPixKeyRemotely = async (input: {
  userId: string
  pixKey: string
}): Promise<{ ok: boolean; message: string }> => {
  if (!hasSupabaseCredentials || !supabase) {
    return { ok: false, message: 'Supabase indisponível para salvar chave PIX.' }
  }

  const response = await supabase.from('trainer_profiles').upsert({
    user_id: input.userId,
    pix_key: input.pixKey.trim() || null,
  })

  if (response.error) {
    return { ok: false, message: 'Não foi possível salvar a chave PIX agora.' }
  }

  return { ok: true, message: 'Chave PIX sincronizada.' }
}

export const upsertTrainerStudentPayment = async (input: {
  userId: string
  studentId: string
  monthRef: string
  monthlyFee: number
  dueDay: number
  pixKey: string
  markAsPaid: boolean
}): Promise<{ ok: boolean; message: string; row?: StudentPaymentRow }> => {
  if (!supabase || !hasSupabaseCredentials) {
    return { ok: false, message: 'Supabase indisponível para sincronizar pagamento.' }
  }

  const response = await supabase.rpc('upsert_student_payment', {
    input_student_id: input.studentId,
    input_month_ref: input.monthRef,
    input_monthly_fee: input.monthlyFee,
    input_due_day: input.dueDay,
    input_pix_key: input.pixKey,
    input_mark_paid: input.markAsPaid,
    input_note: undefined,
  })

  if (response.error) {
    return { ok: false, message: 'Não foi possível salvar pagamento no momento.' }
  }

  const nowMonth = input.monthRef
  const row: StudentPaymentRow = {
    monthlyFee: input.monthlyFee,
    dueDay: input.dueDay,
    paymentMethod: 'pix',
    lastPaidMonth: input.markAsPaid ? nowMonth : null,
    lastPaidAt: input.markAsPaid ? new Date().toISOString() : null,
  }

  return {
    ok: true,
    message: input.markAsPaid ? 'Pagamento marcado como pago.' : 'Pagamento atualizado.',
    row,
  }
}

export const readFinanceStatus = (
  row: StudentPaymentRow,
  monthRef: string,
  now = new Date(),
): 'paid' | 'pending' | 'overdue' => {
  if (row.lastPaidMonth === monthRef) return 'paid'
  return now.getDate() > row.dueDay ? 'overdue' : 'pending'
}

export const toStudentFinanceSnapshot = (
  row: StudentPaymentRow,
  pixKey: string,
): StudentFinanceSnapshot => ({
  ...row,
  pixKey: pixKey.trim(),
})
