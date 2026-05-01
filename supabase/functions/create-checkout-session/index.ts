// Supabase Edge Function skeleton for Stripe Checkout Sessions (subscriptions)
// Stripe API version target: 2026-02-25.clover

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

type CheckoutPayload = {
  plan: 'pro' | 'studio'
  userId: string
  userEmail: string
  successUrl: string
  cancelUrl: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = (await req.json()) as CheckoutPayload

    // TODO:
    // 1) Validate auth using Supabase JWT from Authorization header.
    // 2) Map plan -> Stripe price id (STRIPE_PRICE_PRO / STRIPE_PRICE_STUDIO).
    // 3) Create Stripe Checkout Session in subscription mode.
    // 4) Return { url }.

    if (!body.plan || !body.userId || !body.successUrl || !body.cancelUrl) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        error:
          'Edge function scaffold criada. Implemente a chamada Stripe para gerar checkout URL.',
      }),
      {
        status: 501,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch {
    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
