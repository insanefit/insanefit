import { useQuery } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { loadTrainerData } from '../services/trainerStore'
import { hasSupabaseCredentials } from '../lib/supabase'

const queryUserScope = (userId?: string): string => userId ?? 'anon'

export const trainerQueryKeys = {
  all: ['trainer'] as const,
  data: (userId?: string) => [...trainerQueryKeys.all, 'data', queryUserScope(userId)] as const,
}

type UseTrainerDataQueryArgs = {
  authReady: boolean
  currentUser: User | null
}

export const useTrainerDataQuery = ({ authReady, currentUser }: UseTrainerDataQueryArgs) => {
  const userId = hasSupabaseCredentials ? currentUser?.id : undefined
  const enabled = authReady && (!hasSupabaseCredentials || Boolean(currentUser))

  return useQuery({
    queryKey: trainerQueryKeys.data(userId),
    queryFn: () => loadTrainerData(userId),
    enabled,
  })
}

