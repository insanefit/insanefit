import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthContext, useTrainerContext } from '../../context/appContextStore'
import { useTrainerFinanceQuery, financeQueryKeys } from '../../queries/financeQueries'
import {
  buildCurrentMonthRef,
  readFinanceStatus,
  saveTrainerPixKeyRemotely,
  upsertTrainerStudentPayment,
} from '../../services/paymentStore'
import type { StudentPaymentRow } from '../../types/payment'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

const createDefaultPaymentRow = (): StudentPaymentRow => ({
  monthlyFee: 0,
  dueDay: 10,
  paymentMethod: 'pix',
  lastPaidMonth: null,
  lastPaidAt: null,
})

const clampDay = (value: number): number => {
  if (!Number.isFinite(value)) return 10
  return Math.max(1, Math.min(31, Math.round(value)))
}

const getStatusLabel = (status: 'paid' | 'pending' | 'overdue'): string => {
  if (status === 'paid') return 'Pago'
  if (status === 'overdue') return 'Atrasado'
  return 'Pendente'
}

const buildCollectionReminder = (studentName: string, row: StudentPaymentRow): string => {
  const dueLabel = `dia ${String(row.dueDay).padStart(2, '0')}`
  const feeLabel = currencyFormatter.format(row.monthlyFee)
  return `Oi ${studentName}, tudo bem? Lembrete da mensalidade do seu treino (${feeLabel}), vencimento ${dueLabel}. Pagamento via PIX.`
}

const normalizeWhatsapp = (value: string): string => {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return digits.startsWith('55') ? digits : `55${digits}`
}

export function BillingView() {
  const { currentUser, authReady } = useAuthContext()
  const { students, setSyncMessage } = useTrainerContext()
  const queryClient = useQueryClient()
  const studentIds = useMemo(() => students.map((student) => student.id), [students])
  const financeQuery = useTrainerFinanceQuery({
    authReady,
    userId: currentUser?.id,
    studentIds,
  })

  const [rowDrafts, setRowDrafts] = useState<Record<string, StudentPaymentRow>>({})
  const [pixKeyDraft, setPixKeyDraft] = useState<string | null>(null)
  const monthRef = financeQuery.data?.monthRef ?? buildCurrentMonthRef()
  const currentMonthLabel = monthFormatter.format(new Date())
  const currentPixKey = (pixKeyDraft ?? financeQuery.data?.pixKey ?? '').trim()

  const savePaymentMutation = useMutation({
    mutationFn: async (input: {
      studentId: string
      row: StudentPaymentRow
      markAsPaid: boolean
      studentName: string
    }) => {
      if (!currentUser?.id) {
        return { ok: false, message: 'Faça login para sincronizar pagamentos.' }
      }

      return upsertTrainerStudentPayment({
        userId: currentUser.id,
        studentId: input.studentId,
        monthRef,
        monthlyFee: input.row.monthlyFee,
        dueDay: input.row.dueDay,
        pixKey: currentPixKey,
        markAsPaid: input.markAsPaid,
      })
    },
    onSuccess: async (result) => {
      setSyncMessage(result.message)
      await queryClient.invalidateQueries({ queryKey: financeQueryKeys.all })
    },
  })

  const savePixMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id) {
        return { ok: false, message: 'Faça login para sincronizar a chave PIX.' }
      }
      return saveTrainerPixKeyRemotely({
        userId: currentUser.id,
        pixKey: currentPixKey,
      })
    },
    onSuccess: async (result) => {
      setSyncMessage(result.message)
      await queryClient.invalidateQueries({ queryKey: financeQueryKeys.all })
      if (result.ok) {
        setPixKeyDraft(null)
      }
    },
  })

  const getCurrentRow = (studentId: string): StudentPaymentRow =>
    rowDrafts[studentId] ??
    financeQuery.data?.paymentMap[studentId] ??
    createDefaultPaymentRow()

  const updatePaymentRow = (studentId: string, updater: (current: StudentPaymentRow) => StudentPaymentRow) => {
    setRowDrafts((current) => ({
      ...current,
      [studentId]: updater(getCurrentRow(studentId)),
    }))
  }

  const handleSaveRow = async (studentId: string, studentName: string) => {
    const row = getCurrentRow(studentId)
    await savePaymentMutation.mutateAsync({
      studentId,
      row,
      studentName,
      markAsPaid: row.lastPaidMonth === monthRef,
    })
    setRowDrafts((current) => {
      const next = { ...current }
      delete next[studentId]
      return next
    })
    setPixKeyDraft(null)
  }

  const handleMarkAsPaid = async (studentId: string, studentName: string) => {
    const row = getCurrentRow(studentId)
    const nextRow: StudentPaymentRow = {
      ...row,
      lastPaidMonth: monthRef,
      lastPaidAt: new Date().toISOString(),
    }
    updatePaymentRow(studentId, () => nextRow)
    await savePaymentMutation.mutateAsync({
      studentId,
      studentName,
      row: nextRow,
      markAsPaid: true,
    })
    setRowDrafts((current) => {
      const next = { ...current }
      delete next[studentId]
      return next
    })
    setPixKeyDraft(null)
  }

  const handleResetToPending = async (studentId: string, studentName: string) => {
    const row = getCurrentRow(studentId)
    const nextRow: StudentPaymentRow = {
      ...row,
      lastPaidMonth: null,
      lastPaidAt: null,
    }
    updatePaymentRow(studentId, () => nextRow)
    await savePaymentMutation.mutateAsync({
      studentId,
      studentName,
      row: nextRow,
      markAsPaid: false,
    })
    setRowDrafts((current) => {
      const next = { ...current }
      delete next[studentId]
      return next
    })
    setPixKeyDraft(null)
  }

  const handleCopyReminder = async (studentName: string, row: StudentPaymentRow) => {
    const reminder = buildCollectionReminder(studentName, row)
    try {
      await navigator.clipboard.writeText(reminder)
      setSyncMessage(`Lembrete de cobranca copiado para ${studentName}.`)
    } catch {
      setSyncMessage('Nao foi possivel copiar agora. Tente novamente.')
    }
  }

  const handleCopyPixKey = async () => {
    const cleanPix = currentPixKey
    if (!cleanPix) {
      setSyncMessage('Informe sua chave PIX para copiar.')
      return
    }

    try {
      await navigator.clipboard.writeText(cleanPix)
      setSyncMessage('Chave PIX copiada.')
    } catch {
      setSyncMessage('Nao foi possivel copiar a chave PIX agora.')
    }
  }

  const handleSendPixKey = async (studentName: string, studentWhatsapp: string | undefined) => {
    const cleanPix = currentPixKey
    if (!cleanPix) {
      setSyncMessage('Informe sua chave PIX antes de enviar.')
      return
    }

    const message = `Oi ${studentName}, segue minha chave PIX para pagamento da mensalidade: ${cleanPix}`
    const targetWhatsapp = normalizeWhatsapp(studentWhatsapp ?? '')
    if (targetWhatsapp) {
      window.open(
        `https://wa.me/${targetWhatsapp}?text=${encodeURIComponent(message)}`,
        '_blank',
        'noopener,noreferrer',
      )
      setSyncMessage(`Chave PIX aberta no WhatsApp para ${studentName}.`)
      return
    }

    try {
      await navigator.clipboard.writeText(message)
      setSyncMessage(`Aluno sem WhatsApp cadastrado. Mensagem PIX copiada para ${studentName}.`)
    } catch {
      setSyncMessage(`Aluno sem WhatsApp cadastrado. Mensagem PIX: ${message}`)
    }
  }

  const studentFinanceRows = useMemo(() => {
    const map = financeQuery.data?.paymentMap ?? {}
    const now = new Date()
    return students.map((student) => {
      const row = rowDrafts[student.id] ?? map[student.id] ?? createDefaultPaymentRow()
      const status = readFinanceStatus(row, monthRef, now)
      return { student, row, status }
    })
  }, [students, rowDrafts, financeQuery.data?.paymentMap, monthRef])

  const summary = useMemo(
    () =>
      studentFinanceRows.reduce(
        (accumulator, item) => {
          accumulator.expected += item.row.monthlyFee
          if (item.status === 'paid') {
            accumulator.paid += item.row.monthlyFee
            accumulator.paidCount += 1
          } else {
            accumulator.pendingCount += 1
            if (item.status === 'overdue') accumulator.overdueCount += 1
          }
          return accumulator
        },
        {
          expected: 0,
          paid: 0,
          paidCount: 0,
          pendingCount: 0,
          overdueCount: 0,
        },
      ),
    [studentFinanceRows],
  )

  if (financeQuery.isLoading && !financeQuery.data) {
    return (
      <section id="financeiro" className="finance-section panel">
        <div className="panel-head">
          <h3>Financeiro dos alunos</h3>
          <p>Carregando dados financeiros...</p>
        </div>
      </section>
    )
  }

  if (financeQuery.isError && !financeQuery.data) {
    return (
      <section id="financeiro" className="finance-section panel">
        <div className="panel-head">
          <h3>Financeiro dos alunos</h3>
          <p>Falha ao carregar agora. Tente novamente em instantes.</p>
        </div>
      </section>
    )
  }

  return (
    <section id="financeiro" className="finance-section panel">
      <div className="panel-head">
        <h3>Financeiro dos alunos</h3>
        <p>Controle mensal de pagamentos do personal ({currentMonthLabel}).</p>
      </div>

      <div className="finance-pix-bar">
        <label className="finance-field" htmlFor="finance-pix-key">
          <span>Chave PIX do personal</span>
          <input
            id="finance-pix-key"
            className="field-input"
            value={pixKeyDraft ?? financeQuery.data?.pixKey ?? ''}
            onChange={(event) => setPixKeyDraft(event.target.value)}
            placeholder="email, telefone, cpf ou chave aleatoria"
          />
        </label>
        <button type="button" className="btn-secondary" onClick={handleCopyPixKey}>
          Copiar chave PIX
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            void savePixMutation.mutateAsync()
          }}
          disabled={savePixMutation.isPending}
        >
          Salvar chave PIX
        </button>
      </div>

      <div className="finance-summary-grid">
        <article className="finance-summary-card">
          <span>Previsto</span>
          <strong>{currencyFormatter.format(summary.expected)}</strong>
        </article>
        <article className="finance-summary-card paid">
          <span>Recebido</span>
          <strong>{currencyFormatter.format(summary.paid)}</strong>
        </article>
        <article className="finance-summary-card pending">
          <span>Em aberto</span>
          <strong>{currencyFormatter.format(Math.max(0, summary.expected - summary.paid))}</strong>
        </article>
        <article className="finance-summary-card overdue">
          <span>Atrasados</span>
          <strong>{summary.overdueCount}</strong>
        </article>
      </div>

      {students.length === 0 && (
        <p className="status-line">Cadastre alunos para comecar o controle financeiro.</p>
      )}

      {students.length > 0 && (
        <div className="finance-students-grid">
          {studentFinanceRows.map(({ student, row, status }) => (
            <article key={student.id} className="finance-student-card">
              <div className="finance-card-head">
                <div>
                  <h4>{student.name}</h4>
                  <p>Tipo: {student.workoutType ?? 'Treino personalizado'}</p>
                </div>
                <span className={`finance-status ${status}`}>{getStatusLabel(status)}</span>
              </div>

              <div className="finance-fields">
                <label className="finance-field">
                  <span>Mensalidade (R$)</span>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    className="field-input"
                    value={row.monthlyFee}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value)
                      updatePaymentRow(student.id, (current) => ({
                        ...current,
                        monthlyFee: Number.isFinite(nextValue) ? Math.max(0, nextValue) : 0,
                      }))
                    }}
                  />
                </label>

                <label className="finance-field">
                  <span>Vencimento</span>
                  <select
                    className="field-input"
                    value={row.dueDay}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value)
                      updatePaymentRow(student.id, (current) => ({
                        ...current,
                        dueDay: clampDay(nextValue),
                      }))
                    }}
                  >
                    {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                      <option key={day} value={day}>
                        Dia {String(day).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="finance-field">
                  <span>Forma de pagamento</span>
                  <p className="finance-static-value">PIX</p>
                </div>
              </div>

              <div className="finance-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleSaveRow(student.id, student.name)}
                  disabled={savePaymentMutation.isPending}
                >
                  Salvar ajustes
                </button>
                {status === 'paid' ? (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      void handleResetToPending(student.id, student.name)
                    }}
                    disabled={savePaymentMutation.isPending}
                  >
                    Voltar para pendente
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      void handleMarkAsPaid(student.id, student.name)
                    }}
                    disabled={savePaymentMutation.isPending}
                  >
                    Marcar como pago
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    void handleCopyReminder(student.name, row)
                  }}
                >
                  Copiar lembrete
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    void handleSendPixKey(student.name, student.whatsapp)
                  }}
                >
                  Enviar chave PIX
                </button>
              </div>

              <p className="finance-meta">
                Ultimo pagamento:{' '}
                {row.lastPaidAt ? dateTimeFormatter.format(new Date(row.lastPaidAt)) : 'ainda nao registrado'}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
