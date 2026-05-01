import { useQuery } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { hasSupabaseCredentials } from '../lib/supabase'
import { loadBillingProfile } from '../services/billingStore'
import { loadStudentPortalData } from '../services/trainerStore'

const queryUserScope = (userId?: string): string => userId ?? 'anon'

export const billingQueryKeys = {
  all: ['billing'] as const,
  profile: (userId?: string) => [...billingQueryKeys.all, 'profile', queryUserScope(userId)] as const,
}

export const portalQueryKeys = {
  all: ['portal'] as const,
  student: (userId?: string) => [...portalQueryKeys.all, 'student', queryUserScope(userId)] as const,
}

type UserScopedQueryArgs = {
  authReady: boolean
  currentUser: User | null
}

export const useBillingProfileQuery = ({ authReady, currentUser }: UserScopedQueryArgs) => {
  const userId = hasSupabaseCredentials ? currentUser?.id : undefined
  const enabled = authReady && (!hasSupabaseCredentials || Boolean(currentUser))

  return useQuery({
    queryKey: billingQueryKeys.profile(userId),
    queryFn: () => loadBillingProfile(userId),
    enabled,
  })
}

export const useStudentPortalQuery = ({ authReady, currentUser }: UserScopedQueryArgs) => {
  const userId = hasSupabaseCredentials ? currentUser?.id : undefined
  const enabled = authReady && hasSupabaseCredentials && Boolean(userId)

  return useQuery({
    queryKey: portalQueryKeys.student(userId),
    queryFn: () => loadStudentPortalData(userId ?? ''),
    enabled,
  })
}
