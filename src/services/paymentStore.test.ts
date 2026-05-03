import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/supabase', () => ({
  hasSupabaseCredentials: false,
  supabase: null,
}))

import {
  buildCurrentMonthRef,
  loadTrainerFinanceSnapshot,
  readFinanceStatus,
} from './paymentStore'

describe('paymentStore', () => {
  beforeEach(() => {
    globalThis.localStorage.clear()
  })

  it('calcula status financeiro corretamente', () => {
    const monthRef = '2026-05'
    const now = new Date('2026-05-20T10:00:00.000Z')

    expect(
      readFinanceStatus(
        {
          monthlyFee: 150,
          dueDay: 10,
          paymentMethod: 'pix',
          lastPaidMonth: monthRef,
          lastPaidAt: '2026-05-02T10:00:00.000Z',
        },
        monthRef,
        now,
      ),
    ).toBe('paid')

    expect(
      readFinanceStatus(
        {
          monthlyFee: 150,
          dueDay: 25,
          paymentMethod: 'pix',
          lastPaidMonth: null,
          lastPaidAt: null,
        },
        monthRef,
        now,
      ),
    ).toBe('pending')

    expect(
      readFinanceStatus(
        {
          monthlyFee: 150,
          dueDay: 5,
          paymentMethod: 'pix',
          lastPaidMonth: null,
          lastPaidAt: null,
        },
        monthRef,
        now,
      ),
    ).toBe('overdue')
  })

  it('carrega fallback local quando supabase nao esta disponivel', async () => {
    const userId = 'trainer-1'
    const financeKey = `insanefit:financeiro:v1:${userId}`
    const pixKey = `insanefit:pix_key:v1:${userId}`

    globalThis.localStorage.setItem(
      financeKey,
      JSON.stringify({
        'student-1': {
          monthlyFee: 199.9,
          dueDay: 7,
          paymentMethod: 'pix',
          lastPaidMonth: '2026-05',
          lastPaidAt: '2026-05-01T12:00:00.000Z',
        },
      }),
    )
    globalThis.localStorage.setItem(pixKey, 'chave-pix-teste')

    const snapshot = await loadTrainerFinanceSnapshot(userId, ['student-1', 'student-2'])

    expect(snapshot.monthRef).toBe(buildCurrentMonthRef())
    expect(snapshot.pixKey).toBe('chave-pix-teste')
    expect(snapshot.paymentMap['student-1']).toEqual({
      monthlyFee: 199.9,
      dueDay: 7,
      paymentMethod: 'pix',
      lastPaidMonth: '2026-05',
      lastPaidAt: '2026-05-01T12:00:00.000Z',
    })
    expect(snapshot.paymentMap['student-2']).toEqual({
      monthlyFee: 0,
      dueDay: 10,
      paymentMethod: 'pix',
      lastPaidMonth: null,
      lastPaidAt: null,
    })
  })
})
