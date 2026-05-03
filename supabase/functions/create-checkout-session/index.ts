import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

type PlanId = 'pro' | 'studio'

type CheckoutPayload = {
  plan: PlanId
  userId: string
  userEmail?: string
  successUrl: string
  cancelUrl: string
}

type StripeCustomer = {
  id: string
}

type StripeCheckoutSession = {
  id: string
  url: string | null
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const isValidUrl = (value: string): boolean => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

const getPlanPriceId = (plan: PlanId): string | null => {
  const map: Record<PlanId, string | undefined> = {
    pro: Deno.env.get('STRIPE_PRICE_PRO'),
    studio: Deno.env.get('STRIPE_PRICE_STUDIO'),
  }
  return map[plan]?.trim() || null
}

const createStripeCustomer = async (input: {
  stripeSecretKey: string
  userId: string
  email?: string
}): Promise<{ ok: true; customerId: string } | { ok: false; message: string }> => {
  const payload = new URLSearchParams()
  if (input.email) {
    payload.set('email', input.email)
  }
  payload.set('metadata[user_id]', input.userId)

  const response = await fetch('https://api.stripe.com/v1/customers', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload.toString(),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    return { ok: false, message: `Stripe customer error: ${errorBody}` }
  }

  const customer = (await response.json()) as StripeCustomer
  if (!customer.id) {
    return { ok: false, message: 'Stripe nao retornou customer id.' }
  }

  return { ok: true, customerId: customer.id }
}

const createStripeCheckoutSession = async (input: {
  stripeSecretKey: string
  userId: string
  customerId: string
  plan: PlanId
  priceId: string
  successUrl: string
  cancelUrl: string
}): Promise<{ ok: true; session: StripeCheckoutSession } | { ok: false; message: string }> => {
  const payload = new URLSearchParams()
  payload.set('mode', 'subscription')
  payload.set('customer', input.customerId)
  payload.set('line_items[0][price]', input.priceId)
  payload.set('line_items[0][quantity]', '1')
  payload.set('success_url', input.successUrl)
  payload.set('cancel_url', input.cancelUrl)
  payload.set('client_reference_id', input.userId)
  payload.set('metadata[user_id]', input.userId)
  payload.set('metadata[plan]', input.plan)
  payload.set('subscription_data[metadata][user_id]', input.userId)
  payload.set('subscription_data[metadata][plan]', input.plan)
  payload.set('allow_promotion_codes', 'true')

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload.toString(),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    return { ok: false, message: `Stripe checkout error: ${errorBody}` }
  }

  const session = (await response.json()) as StripeCheckoutSession
  if (!session.id || !session.url) {
    return { ok: false, message: 'Stripe nao retornou URL de checkout.' }
  }

  return { ok: true, session }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'method_not_allowed' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim()
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim()
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')?.trim()

  if (!supabaseUrl || !supabaseServiceRoleKey || !stripeSecretKey) {
    return json(500, { error: 'missing_server_env' })
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return json(401, { error: 'missing_auth_header' })
  }

  let body: CheckoutPayload
  try {
    body = (await req.json()) as CheckoutPayload
  } catch {
    return json(400, { error: 'invalid_json' })
  }

  if (!body.plan || !body.userId || !body.successUrl || !body.cancelUrl) {
    return json(400, { error: 'invalid_payload' })
  }

  if (!isValidUrl(body.successUrl) || !isValidUrl(body.cancelUrl)) {
    return json(400, { error: 'invalid_redirect_urls' })
  }

  const priceId = getPlanPriceId(body.plan)
  if (!priceId) {
    return json(500, { error: `missing_price_for_plan_${body.plan}` })
  }

  const authClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })

  const authResult = await authClient.auth.getUser()
  if (authResult.error || !authResult.data.user) {
    return json(401, { error: 'invalid_auth_token' })
  }

  const authUser = authResult.data.user
  if (authUser.id !== body.userId) {
    return json(403, { error: 'user_mismatch' })
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  })

  const profileResult = await adminClient
    .from('trainer_profiles')
    .select('stripe_customer_id')
    .eq('user_id', authUser.id)
    .maybeSingle()

  if (profileResult.error) {
    return json(500, { error: 'profile_query_failed', details: profileResult.error.message })
  }

  let customerId = profileResult.data?.stripe_customer_id ?? null
  if (!customerId) {
    const created = await createStripeCustomer({
      stripeSecretKey,
      userId: authUser.id,
      email: body.userEmail || authUser.email || undefined,
    })
    if (!created.ok) {
      return json(502, { error: 'stripe_customer_create_failed', details: created.message })
    }
    customerId = created.customerId

    const upsertResult = await adminClient.from('trainer_profiles').upsert({
      user_id: authUser.id,
      stripe_customer_id: customerId,
    })
    if (upsertResult.error) {
      return json(500, { error: 'profile_upsert_failed', details: upsertResult.error.message })
    }
  }

  const checkout = await createStripeCheckoutSession({
    stripeSecretKey,
    userId: authUser.id,
    customerId,
    plan: body.plan,
    priceId,
    successUrl: body.successUrl,
    cancelUrl: body.cancelUrl,
  })
  if (!checkout.ok) {
    return json(502, { error: 'stripe_checkout_failed', details: checkout.message })
  }

  return json(200, {
    url: checkout.session.url,
    sessionId: checkout.session.id,
  })
})
