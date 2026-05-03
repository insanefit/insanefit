import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

type StripeEvent = {
  id: string
  type: string
  data: {
    object: Record<string, unknown>
  }
}

type SubscriptionStatus = 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled'
type PlanId = 'free' | 'pro' | 'studio'

const json = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const encoder = new TextEncoder()

const hex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

const secureCompare = (left: string, right: string): boolean => {
  if (left.length !== right.length) return false
  let result = 0
  for (let i = 0; i < left.length; i += 1) {
    result |= left.charCodeAt(i) ^ right.charCodeAt(i)
  }
  return result === 0
}

const verifyStripeSignature = async (input: {
  payload: string
  signatureHeader: string
  webhookSecret: string
}): Promise<boolean> => {
  const signatureParts = input.signatureHeader.split(',').map((item) => item.trim())
  const timestamp = signatureParts.find((part) => part.startsWith('t='))?.slice(2)
  const signatures = signatureParts
    .filter((part) => part.startsWith('v1='))
    .map((part) => part.slice(3))
    .filter(Boolean)

  if (!timestamp || signatures.length === 0) return false

  const signedPayload = `${timestamp}.${input.payload}`
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(input.webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload))
  const expected = hex(digest)

  return signatures.some((signature) => secureCompare(signature, expected))
}

const toSubscriptionStatus = (status: string): SubscriptionStatus => {
  if (status === 'trialing') return 'trialing'
  if (status === 'active') return 'active'
  if (status === 'past_due') return 'past_due'
  if (status === 'canceled') return 'canceled'
  return 'inactive'
}

const toIsoFromUnix = (seconds: unknown): string | null => {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return null
  return new Date(seconds * 1000).toISOString()
}

const planFromPriceId = (priceId: string | null): PlanId | null => {
  const proPriceId = Deno.env.get('STRIPE_PRICE_PRO')?.trim()
  const studioPriceId = Deno.env.get('STRIPE_PRICE_STUDIO')?.trim()
  if (!priceId) return null
  if (proPriceId && priceId === proPriceId) return 'pro'
  if (studioPriceId && priceId === studioPriceId) return 'studio'
  return null
}

const planFromUnknown = (value: unknown): PlanId | null => {
  if (value === 'pro' || value === 'studio' || value === 'free') return value
  return null
}

const resolvePriceIdFromSubscription = (object: Record<string, unknown>): string | null => {
  const items = object.items
  if (!items || typeof items !== 'object') return null
  const data = (items as { data?: unknown }).data
  if (!Array.isArray(data) || data.length === 0) return null
  const first = data[0]
  if (!first || typeof first !== 'object') return null
  const price = (first as { price?: unknown }).price
  if (!price || typeof price !== 'object') return null
  const id = (price as { id?: unknown }).id
  return typeof id === 'string' ? id : null
}

const getString = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value.trim() : null)

serve(async (req) => {
  if (req.method !== 'POST') {
    return json(405, { error: 'method_not_allowed' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim()
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim()
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')?.trim()

  if (!supabaseUrl || !supabaseServiceRoleKey || !webhookSecret) {
    return json(500, { error: 'missing_server_env' })
  }

  const signatureHeader = req.headers.get('stripe-signature') ?? ''
  const payload = await req.text()
  const valid = await verifyStripeSignature({
    payload,
    signatureHeader,
    webhookSecret,
  })

  if (!valid) {
    return json(400, { error: 'invalid_signature' })
  }

  let event: StripeEvent
  try {
    event = JSON.parse(payload) as StripeEvent
  } catch {
    return json(400, { error: 'invalid_json' })
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  })

  const object = event.data?.object ?? {}
  const objectRecord = typeof object === 'object' && object !== null ? object : {}

  if (event.type === 'checkout.session.completed') {
    const metadata = (objectRecord.metadata ?? {}) as Record<string, unknown>
    const userId = getString(metadata.user_id) || getString(objectRecord.client_reference_id)
    const customerId = getString(objectRecord.customer)
    const subscriptionId = getString(objectRecord.subscription)
    const plan = planFromUnknown(metadata.plan) ?? 'free'

    if (!userId || !customerId) {
      return json(200, { received: true, skipped: 'missing_user_or_customer' })
    }

    const result = await adminClient.from('trainer_profiles').upsert({
      user_id: userId,
      plan,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    })

    if (result.error) {
      return json(500, { error: 'profile_upsert_failed', details: result.error.message })
    }

    return json(200, { received: true, eventId: event.id })
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const metadata = (objectRecord.metadata ?? {}) as Record<string, unknown>
    const customerId = getString(objectRecord.customer)
    const subscriptionId = getString(objectRecord.id)
    const rawStatus = getString(objectRecord.status) ?? 'inactive'
    const status = toSubscriptionStatus(rawStatus)
    const periodEnd = toIsoFromUnix(objectRecord.current_period_end)
    const priceId = resolvePriceIdFromSubscription(objectRecord)
    const metadataPlan = planFromUnknown(metadata.plan)
    const mappedPlan = planFromPriceId(priceId)
    const derivedPlan: PlanId = status === 'canceled' || status === 'inactive'
      ? 'free'
      : (metadataPlan ?? mappedPlan ?? 'pro')

    let userId = getString(metadata.user_id)
    if (!userId && customerId) {
      const profile = await adminClient
        .from('trainer_profiles')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()
      if (profile.error) {
        return json(500, { error: 'profile_lookup_failed', details: profile.error.message })
      }
      userId = profile.data?.user_id ?? null
    }

    if (!userId) {
      return json(200, { received: true, skipped: 'missing_user_id' })
    }

    const updateResult = await adminClient.from('trainer_profiles').upsert({
      user_id: userId,
      plan: derivedPlan,
      subscription_status: status,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    })

    if (updateResult.error) {
      return json(500, { error: 'profile_update_failed', details: updateResult.error.message })
    }
  }

  return json(200, { received: true, eventId: event.id })
})
