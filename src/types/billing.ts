export type PlanId = 'free' | 'pro' | 'studio'

export type SubscriptionStatus =
  | 'inactive'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'

export type PlanDefinition = {
  id: PlanId
  name: string
  monthlyPrice: number
  description: string
  studentLimit: number | null
  features: string[]
  highlight: string
}

export type BillingProfile = {
  plan: PlanId
  subscriptionStatus: SubscriptionStatus
  periodEndsAt: string | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}

export type CheckoutStartResult = {
  ok: boolean
  message: string
  url?: string
}
