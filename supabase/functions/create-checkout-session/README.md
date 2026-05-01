# create-checkout-session (scaffold)

Funcao edge para iniciar Checkout Session de assinatura no Stripe.

## Entrada esperada

```json
{
  "plan": "pro",
  "userId": "uuid",
  "userEmail": "email@dominio.com",
  "successUrl": "https://app.exemplo.com?billing=success",
  "cancelUrl": "https://app.exemplo.com?billing=cancel"
}
```

## Variaveis recomendadas

- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_STUDIO`

## Proximo passo

Implementar criacao de Checkout Session no modo `subscription` e retornar:

```json
{ "url": "https://checkout.stripe.com/..." }
```

Depois, criar webhook Stripe para sincronizar `trainer_profiles` com status da assinatura.
