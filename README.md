# Insane Fit

App web para personal trainer no estilo Mfit, com foco em:

- gestao de alunos
- agenda semanal de aulas
- progresso por aluno
- cadastro rapido de alunos e sessoes
- login por personal trainer
- portal do aluno (vinculo por codigo de acesso)
- isolamento de dados por usuario (RLS)
- estrutura de assinaturas (Free, Pro, Studio)

## Stack

- React 19 + TypeScript + Vite
- Persistencia local por `localStorage` (fallback)
- Sincronizacao com Supabase + Auth (recomendado)
- Base pronta para Stripe Billing (checkout por edge function)

## Rodar local

```bash
npm install
npm run dev
```

Build de producao:

```bash
npm run build
npm run preview
```

## Gerar tipos do Supabase (automatico)

O app usa `src/types/database.generated.ts` para tipar tabelas e RPCs.

Para regenerar do seu projeto Supabase:

```bash
export SUPABASE_ACCESS_TOKEN="seu_token_supabase"
npm run supabase:types
```

Opcionalmente, voce pode forcar o projeto com:

```bash
export SUPABASE_PROJECT_ID="xxxxxx"
npm run supabase:types
```

Se `SUPABASE_PROJECT_ID` nao for informado, o script usa o projeto de `VITE_SUPABASE_URL`.

## Modo local (padrao)

Sem configurar variaveis de ambiente, o app roda em modo local com dados salvos no navegador.

## Conectar no Supabase (opcional)

1. Crie um projeto no Supabase.
2. Rode o SQL de `supabase/schema.sql` no SQL editor do Supabase.
3. Copie `.env.example` para `.env` e preencha as chaves.
4. Rode `npm run dev`.

Se voce ja tinha as tabelas antigas sem `user_id`, rode o `schema.sql` novamente para aplicar os `ALTER TABLE` e as novas policies.
Essa versao adiciona tambem `share_code`, `student_user_id` e a funcao `claim_student_access` para acesso do aluno.
O `share_code` agora e gerado automaticamente no banco (Supabase/Postgres).
O perfil do coach (nome, titulo, avatar e contatos) tambem sincroniza em `trainer_profiles`.
Tambem adiciona RBAC com `user_roles`, tabela de financeiro `student_payments`,
funcoes atomicas (`upsert_student_payment`, `get_student_portal_finance`) e reforco de policies com override admin.

Variaveis esperadas:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY` (opcional nesta fase)
- `VITE_EXERCISEDB_API_KEY` (opcional, para importar GIFs/animações via RapidAPI)
- `VITE_EXERCISEDB_API_HOST` (opcional, padrao `exercisedb.p.rapidapi.com`)

## Estrutura principal

- `src/App.tsx`: auth, dashboard principal e formularios
- `src/services/trainerStore.ts`: auth + carga/salvamento local/Supabase
- `src/services/billingStore.ts`: perfil de assinatura + checkout
- `src/services/paymentStore.ts`: financeiro (PIX/pagamentos por aluno)
- `src/services/coachStore.ts`: perfil do coach (nome, titulo, contatos)
- `src/queries/*`: cache e sincronizacao com TanStack Query
- `src/lib/supabase.ts`: cliente Supabase

## Observacao de seguranca

O SQL desta versao aplica Row Level Security por `auth.uid()` para separar os dados de cada personal
e permitir que cada aluno autenticado veja apenas o proprio treino e agenda vinculados.
Com RBAC: `trainer`, `student` e `admin`.
Novos usuarios recebem role `trainer` automaticamente via trigger.

## Billing / planos

- Planos no app: `free`, `pro`, `studio`
- Limite de alunos aplicado por plano ao criar novos cadastros
- Perfil de assinatura salvo em `trainer_profiles`
- Botao de checkout pronto para chamar a edge function `create-checkout-session`

Para ativar pagamento real no Stripe:

1. Criar a edge function `create-checkout-session` no Supabase.
2. Na function, criar `Checkout Session` de assinatura no Stripe Billing.
3. Atualizar `trainer_profiles` via webhook Stripe (`customer.subscription.updated`).
