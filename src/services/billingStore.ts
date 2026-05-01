import { getPlanDefinition } from '../data/plans'
import { hasSupabaseCredentials, supabase } from '../lib/supabase'
import type {
  BillingProfile,
  CheckoutStartResult,
  PlanId,
  SubscriptionStatus,
} from '../types/billing'

const billingStorageKey = 'insanefit:billing:v1'
const legacyBillingStorageKey = 'pulsecoach:billing:v1'

type BillingRow = {
  user_id: string
  plan: PlanId
  subscription_status: SubscriptionStatus
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_end: string | null
}

export const defaultBillingProfile: BillingProfile = {
  plan: 'free',
  subscriptionStatus: 'inactive',
  periodEndsAt: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
}

const scopedKey = (base: string, userId?: string): string =>
  userId ? `${base}:${userId}` : base

const readStorage = <T>(key: string): T | null => {
  try {
    const content = localStorage.getItem(key)
    return content ? (JSON.parse(content) as T) : null
  } catch {
    return null
  }
}

const writeStorage = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value))
}

const readScopedStorage = <T>(base: string, legacyBase: string, userId?: string): T | null => {
  const currentKey = scopedKey(base, userId)
  const currentValue = readStorage<T>(currentKey)
  if (currentValue) {
    return currentValue
  }

  const legacyKey = scopedKey(legacyBase, userId)
  const legacyValue = readStorage<T>(legacyKey)
  if (!legacyValue) {
    return null
  }

  writeStorage(currentKey, legacyValue)
  localStorage.removeItem(legacyKey)
  return legacyValue
}

const mapBillingRow = (row: BillingRow): BillingProfile => ({
  plan: row.plan,
  subscriptionStatus: row.subscription_status,
  periodEndsAt: row.current_period_end,
  stripeCustomerId: row.stripe_customer_id,
  stripeSubscriptionId: row.stripe_subscription_id,
})

export const loadBillingProfile = async (userId?: string): Promise<BillingProfile> => {
  if (hasSupabaseCredentials && userId && supabase) {
    const response = await supabase
      .from('trainer_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (!response.error && response.data) {
      return mapBillingRow(response.data as BillingRow)
    }

    const local = readScopedStorage<BillingProfile>(billingStorageKey, legacyBillingStorageKey, userId)
    return local ?? defaultBillingProfile
  }

  const local = readScopedStorage<BillingProfile>(billingStorageKey, legacyBillingStorageKey, userId)
  if (local) {
    return local
  }

  writeStorage(scopedKey(billingStorageKey, userId), defaultBillingProfile)
  return defaultBillingProfile
}

export const persistLocalBillingProfile = (
  profile: BillingProfile,
  userId?: string,
) => {
  writeStorage(scopedKey(billingStorageKey, userId), profile)
}

export const setPlanManually = async (
  plan: PlanId,
  userId?: string,
): Promise<boolean> => {
  const nextProfile: BillingProfile = {
    ...defaultBillingProfile,
    plan,
    subscriptionStatus: plan === 'free' ? 'inactive' : 'active',
  }

  if (hasSupabaseCredentials && userId && supabase) {
    const { error } = await supabase.from('trainer_profiles').upsert({
      user_id: userId,
      plan,
      subscription_status: nextProfile.subscriptionStatus,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      current_period_end: null,
    })

    if (error) {
      return false
    }
  }

  persistLocalBillingProfile(nextProfile, userId)
  return true
}

export const canCreateStudent = (plan: PlanId, currentStudents: number): boolean => {
  const definition = getPlanDefinition(plan)
  if (definition.studentLimit === null) {
    return true
  }

  return currentStudents < definition.studentLimit
}

export const createCheckoutSession = async (
  plan: PlanId,
  userId: string,
  userEmail: string,
): Promise<CheckoutStartResult> => {
  if (!supabase) {
    return {
      ok: false,
      message: 'Supabase nao configurado para iniciar checkout.',
    }
  }

  if (plan === 'free') {
    return {
      ok: false,
      message: 'Plano Free nao precisa de checkout.',
    }
  }

  const result = await supabase.functions.invoke('create-checkout-session', {
    body: {
      plan,
      userId,
      userEmail,
      successUrl: `${window.location.origin}?billing=success`,
      cancelUrl: `${window.location.origin}?billing=cancel`,
    },
  })

  if (result.error) {
    return {
      ok: false,
      message:
        'Checkout indisponivel. Crie a edge function create-checkout-session para ligar Stripe Billing.',
    }
  }

  const payload = result.data as { url?: string } | null

  if (!payload?.url) {
    return {
      ok: false,
      message: 'A resposta de checkout veio sem URL de redirecionamento.',
    }
  }

  return {
    ok: true,
    message: 'Checkout iniciado com sucesso.',
    url: payload.url,
  }
}
