import { useQuery } from '@tanstack/react-query'
import { hasSupabaseCredentials } from '../lib/supabase'
import { loadTrainerFinanceSnapshot } from '../services/paymentStore'

const queryUserScope = (userId?: string): string => userId ?? 'anon'

export const financeQueryKeys = {
  all: ['finance'] as const,
  snapshot: (userId?: string, studentsHash = 'none') =>
    [...financeQueryKeys.all, 'snapshot', queryUserScope(userId), studentsHash] as const,
}

export const useTrainerFinanceQuery = (input: {
  authReady: boolean
  userId?: string
  studentIds: string[]
}) => {
  const studentsHash = input.studentIds.join('|') || 'none'
  const enabled = input.authReady && (!hasSupabaseCredentials || Boolean(input.userId))
  return useQuery({
    queryKey: financeQueryKeys.snapshot(input.userId, studentsHash),
    queryFn: () => loadTrainerFinanceSnapshot(input.userId, input.studentIds),
    enabled,
  })
}
