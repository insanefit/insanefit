# Guia de Variaveis de Ambiente

Copie `.env.example` para `.env` e preencha os valores necessarios.

```bash
cp .env.example .env
```

## App (Vite)

### Obrigatorias para modo Supabase

- `VITE_SUPABASE_URL`
  - URL do projeto Supabase
  - Ex: `https://xxxx.supabase.co`
- `VITE_SUPABASE_ANON_KEY`
  - Chave anon publica do projeto

Sem essas duas variaveis, o app entra em **modo local**.

### Opcionais

- `VITE_STRIPE_PUBLISHABLE_KEY`
  - Necessaria quando checkout Stripe estiver ativo na UI

- `VITE_EXERCISEDB_API_KEY`
  - Chave RapidAPI para importacao de GIFs do ExerciseDB

- `VITE_EXERCISEDB_API_HOST`
  - Default recomendado: `exercisedb.p.rapidapi.com`

## Scripts e ferramentas

### Geracao de tipos Supabase

- `SUPABASE_ACCESS_TOKEN`
  - Token pessoal para CLI/API Supabase (nao expor em frontend)
- `SUPABASE_PROJECT_ID` (opcional)
  - Forca o projeto alvo na geracao dos tipos

Comandos:

```bash
export SUPABASE_ACCESS_TOKEN="sbp_xxx"
npm run supabase:types
```

## Edge Functions (Stripe)

Variaveis para as funcoes `create-checkout-session` e `stripe-webhook`:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_STUDIO`

Exemplo de setup:

```bash
supabase secrets set \
  SUPABASE_URL="https://<project-ref>.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" \
  STRIPE_SECRET_KEY="<stripe-secret>" \
  STRIPE_WEBHOOK_SECRET="<stripe-webhook-secret>" \
  STRIPE_PRICE_PRO="<price_id_pro>" \
  STRIPE_PRICE_STUDIO="<price_id_studio>"
```

## Boas praticas

- Nunca commitar `.env` no git.
- Nao reutilizar tokens pessoais em pipelines sem rotacao.
- Manter secrets de CI/CD apenas no GitHub/Vercel Secrets.
