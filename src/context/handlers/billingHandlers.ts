import type { Dispatch, SetStateAction } from 'react'
import type { User } from '@supabase/supabase-js'
import { getPlanDefinition } from '../../data/plans'
import type { PlanId } from '../../types/billing'
import { createCheckoutSession } from '../../services/billingStore'

type BillingHandlerDeps = {
  currentUser: User | null
  setSyncMessage: Dispatch<SetStateAction<string>>
  setBillingLoading: Dispatch<SetStateAction<boolean>>
  syncSetBillingPlanRemote: (input: {
    planId: PlanId
    userId?: string
  }) => Promise<boolean>
}

export const createBillingHandlers = ({
  currentUser,
  setSyncMessage,
  setBillingLoading,
  syncSetBillingPlanRemote,
}: BillingHandlerDeps) => {
  const handlePlanDemoSelect = async (planId: PlanId) => {
    const userId = currentUser?.id
    setBillingLoading(true)
    const changed = await syncSetBillingPlanRemote({ planId, userId })
    setBillingLoading(false)

    if (!changed) {
      setSyncMessage('Nao foi possivel atualizar o plano agora.')
      return
    }

    setSyncMessage(
      planId === 'free' ? 'Plano Free ativo.' : `Plano ${getPlanDefinition(planId).name} ativo em modo demo.`,
    )
  }

  const handleCheckout = async (planId: PlanId) => {
    if (!currentUser) {
      setSyncMessage('Faca login para abrir o checkout.')
      return
    }

    setBillingLoading(true)
    const checkout = await createCheckoutSession(planId, currentUser.id, currentUser.email ?? '')
    setBillingLoading(false)

    if (!checkout.ok) {
      setSyncMessage(checkout.message)
      return
    }

    if (checkout.url) {
      window.location.assign(checkout.url)
    }
  }

  return { handlePlanDemoSelect, handleCheckout }
}
