# stripe-webhook

Edge Function para receber eventos do Stripe e sincronizar assinatura no `trainer_profiles`.

## Endpoint

`POST /functions/v1/stripe-webhook`

## Eventos tratados

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Variaveis de ambiente

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_STUDIO`

## O que atualiza em `trainer_profiles`

- `plan`
- `subscription_status`
- `stripe_customer_id`
- `stripe_subscription_id`
- `current_period_end`

## Observacao

Configure no dashboard Stripe um endpoint webhook apontando para:

`https://<PROJECT-REF>.supabase.co/functions/v1/stripe-webhook`
