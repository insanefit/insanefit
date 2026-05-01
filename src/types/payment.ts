export type PaymentMethod = 'pix'

export type PaymentStatus = 'paid' | 'pending' | 'overdue'

export type StudentPaymentRow = {
  monthlyFee: number
  dueDay: number
  paymentMethod: PaymentMethod
  lastPaidMonth: string | null
  lastPaidAt: string | null
}

export type StudentFinanceSnapshot = StudentPaymentRow & {
  pixKey: string
}

export type TrainerFinanceSnapshot = {
  monthRef: string
  pixKey: string
  paymentMap: Record<string, StudentPaymentRow>
}
