# create-checkout-session

Edge Function que cria uma Stripe Checkout Session (assinatura) para os planos `pro` e `studio`.

## Entrada (POST JSON)

```json
{
  "plan": "pro",
  "userId": "uuid-do-auth-user",
  "userEmail": "email@dominio.com",
  "successUrl": "https://insanefit.vercel.app?billing=success",
  "cancelUrl": "https://insanefit.vercel.app?billing=cancel"
}
```

## Regras de seguranca

- Exige `Authorization: Bearer <jwt>` valido.
- O `userId` do payload precisa ser igual ao `user.id` do token.
- Nao aceita URLs de redirecionamento invalidas.

## Variaveis de ambiente

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_STUDIO`

## Resposta de sucesso

```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_..."
}
```
