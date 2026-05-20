<p align="center">
  <img src="public/if-brand-full.png" alt="Insane Fit" width="280" />
</p>

<h1 align="center">Insane Fit</h1>

<p align="center">
  Plataforma completa para personal trainers gerenciarem alunos, fichas de treino e cobranças — com funcionamento offline e sincronização na nuvem.
</p>

<p align="center">
  <a href="https://github.com/insanefit/insanefit/actions/workflows/ci.yml"><img src="https://github.com/insanefit/insanefit/actions/workflows/ci.yml/badge.svg?branch=dev" alt="CI" /></a>
  <a href="https://github.com/insanefit/insanefit/actions/workflows/cd-vercel.yml"><img src="https://github.com/insanefit/insanefit/actions/workflows/cd-vercel.yml/badge.svg?branch=dev" alt="CD Vercel" /></a>
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript" alt="TypeScript 6" />
  <img src="https://img.shields.io/badge/Vite-8-purple?logo=vite" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Supabase-BaaS-green?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/PWA-ready-orange" alt="PWA" />
</p>

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Comandos](#comandos)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Banco de Dados (Supabase)](#banco-de-dados-supabase)
- [Modo Offline / PWA](#modo-offline--pwa)
- [Testes](#testes)
- [Billing / Planos](#billing--planos)
- [Segurança](#segurança)
- [Deploy](#deploy)
- [Documentação Adicional](#documentação-adicional)

---

## Funcionalidades

### Para o Personal Trainer

- **Cadastro de Alunos** — dados completos com tipo de treino, nível, sexo, WhatsApp e código de acesso.
- **Construtor de Fichas** — biblioteca com 800+ exercícios, templates prontos, filtros avançados, protocolo de séries (Feeder/Work/Cluster/Myo-reps) e vídeos demonstrativos.
- **Agenda Semanal** — sessões por dia, horário e foco muscular.
- **Painel Financeiro** — controle de mensalidades, status de pagamento, chave PIX e lembretes de cobrança via WhatsApp.
- **Perfil do Coach** — nome, título, avatar e contatos.
- **Dashboard** — taxa de conclusão, alunos ativos e visão geral.

### Para o Aluno (Portal)

- **Acesso por código** — o treinador compartilha um link/código para o aluno visualizar seu treino.
- **Execução guiada** — séries passo a passo com aquecimento, feeder, work sets, cluster e myo-reps.
- **Registro de cargas e repetições** — com histórico persistente.
- **Timer de descanso** — cronômetro integrado com alerta sonoro.
- **Vídeos demonstrativos** — thumbnails do YouTube e GIFs inline.

### Técnicas

- **Local-first** — funciona 100% sem internet, com sync automático ao reconectar.
- **PWA** — instalável na tela inicial do celular.
- **Zero `any`** — tipagem TypeScript estrita em toda a base.
- **Validação Zod** — na fronteira de dados Supabase → aplicação.
- **Isolamento por usuário** — Row Level Security (RLS) no Supabase.

---

## Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework UI | React | 19 |
| Linguagem | TypeScript | 6.0 |
| Bundler | Vite | 8 |
| Backend (BaaS) | Supabase (PostgreSQL + Auth) | 2.x |
| Data Fetching | TanStack React Query | 5.x |
| Validação | Zod | 3.x |
| Formulários | React Hook Form | 7.x |
| Testes | Vitest + Testing Library | 4.x |
| Pagamento | Stripe (via Edge Functions) | — |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                      React 19 (UI)                       │
│   Components ──── Context API ──── React Query            │
├──────────────┬──────────────┬─────────────────────────────┤
│   Handlers   │   Effects    │   Derived State             │
├──────────────┴──────────────┴─────────────────────────────┤
│                   Services Layer                          │
│  trainerStore · billingStore · coachStore · paymentStore   │
│                 offlineSyncQueue                           │
├────────────────────────────┬──────────────────────────────┤
│       localStorage         │         Supabase             │
│      (offline-first)       │   (PostgreSQL + RLS)         │
└────────────────────────────┴──────────────────────────────┘
```

O estado da aplicação é gerenciado via **Context API** com separação interna em:

- **State Slices** — 13 hooks de estado isolados (`appStateSlices.ts`)
- **Handlers** — 8 módulos de lógica de negócio (`handlers/`)
- **Derived State** — valores computados via `useMemo` (`appDerivedState.ts`)
- **Effects** — 8 hooks de efeitos colaterais (`appEffects.ts`)

---

## Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| Node.js | 20+ |
| npm | 10+ |

> O projeto funciona **sem Supabase** (modo local-only). Para habilitar login, sincronização na nuvem e portal do aluno, configure as variáveis de ambiente.

---

## Instalação

```bash
# Clone o repositório
git clone https://github.com/insanefit/insanefit.git
cd insanefit

# Instale dependências
npm install

# (Opcional) Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas chaves

# Inicie o servidor de desenvolvimento
npm run dev
```

O app estará disponível em `http://localhost:5173`.

### Build de produção

```bash
npm run build
npm run preview
```

---

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz (use `.env.example` como base):

| Variável | Obrigatória | Descrição |
|---|---|---|
| `VITE_SUPABASE_URL` | Não* | URL do projeto Supabase (`https://xxxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Não* | Chave anônima (public) do Supabase |
| `VITE_EXERCISEDB_API_KEY` | Não | Chave RapidAPI para importar vídeos do ExerciseDB |
| `VITE_EXERCISEDB_API_HOST` | Não | Host da API (`exercisedb.p.rapidapi.com`) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Não | Chave pública Stripe para checkout |
| `SUPABASE_PROJECT_ID` | Não | Usado pelo script `supabase:types` |
| `SUPABASE_ACCESS_TOKEN` | Não | Usado pelo script `supabase:types` |

> \* Sem as variáveis do Supabase, o app roda em **modo local-only** — todos os dados ficam no `localStorage` do navegador.

---

## Comandos

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Compila TypeScript e gera bundle de produção |
| `npm run preview` | Serve o build de produção localmente |
| `npm run typecheck` | Verifica tipagem sem emitir arquivos (`tsc --noEmit`) |
| `npm run lint` | Executa ESLint em todo o projeto |
| `npm run test` | Vitest em modo watch |
| `npm run test:run` | Executa todos os testes uma vez |
| `npm run test:coverage` | Relatório de cobertura com V8 |
| `npm run pwa:check` | Valida manifesto, service worker e assets PWA |
| `npm run supabase:types` | Gera tipagem TypeScript das tabelas do Supabase |

---

## Estrutura do Projeto

```
src/
├── components/           # Componentes React por domínio
│   ├── auth/             #   Login, signup e recuperação de senha
│   ├── billing/          #   Painel financeiro e pagamentos
│   ├── common/           #   Error boundary
│   ├── dashboard/        #   Dashboard principal
│   ├── layout/           #   Topbar e Sidebar
│   ├── portal/           #   Portal do aluno (execução de treino)
│   ├── schedule/         #   Agenda semanal
│   ├── settings/         #   Configurações do coach
│   ├── students/         #   CRUD de alunos
│   ├── timer/            #   Timer de descanso
│   └── workout/          #   Construtor de fichas de treino
├── constants/            # Constantes (opções de formulário, templates)
├── context/              # Gerenciamento de estado (Context API)
│   ├── constants/        #   Valores iniciais
│   ├── derived/          #   Estado computado (useMemo)
│   ├── effects/          #   Hooks de efeitos colaterais
│   ├── factories/        #   Builder do objeto de contexto
│   ├── handlers/         #   Lógica de negócio
│   ├── helpers/          #   Utilitários de renderização
│   └── state/            #   State slices (useState agrupados)
├── data/                 # Dados estáticos (biblioteca de exercícios, planos)
├── lib/                  # Cliente Supabase
├── queries/              # React Query hooks (cache + sync)
├── schemas/              # Schemas Zod (validação de dados e formulários)
├── services/             # Persistência, sincronização e API
│   ├── trainerStore.ts   #   Auth + CRUD local/Supabase
│   ├── billingStore.ts   #   Perfil de assinatura + checkout
│   ├── paymentStore.ts   #   Financeiro (PIX/pagamentos por aluno)
│   ├── coachStore.ts     #   Perfil do coach (nome, título, contatos)
│   └── offlineSyncQueue.ts # Fila de mutações offline
├── types/                # Tipagens TypeScript
│   └── database.generated.ts  # Tipos gerados do Supabase
└── utils/                # Funções utilitárias puras
```

---

## Banco de Dados (Supabase)

### Conectar no Supabase

1. Crie um projeto no [Supabase](https://supabase.com).
2. Rode o SQL de `supabase/schema.sql` no SQL Editor do Supabase.
3. Copie `.env.example` para `.env` e preencha as chaves.
4. Rode `npm run dev`.

> Se você já tinha tabelas antigas sem `user_id`, rode o `schema.sql` novamente para aplicar os `ALTER TABLE` e as novas policies.

### Tabelas principais

| Tabela | Descrição |
|---|---|
| `students` | Cadastro de alunos do personal |
| `sessions` | Sessões de treino agendadas |
| `exercises` | Exercícios vinculados por aluno |
| `exercise_videos` | Mapa de vídeos customizados por exercício |
| `trainer_profiles` | Perfil do coach, chave PIX e plano |
| `student_payments` | Controle de mensalidades |
| `student_portal_access` | Vínculos aluno ↔ usuário para portal |
| `user_roles` | RBAC: `trainer`, `student`, `admin` |

### Gerar tipos automaticamente

```bash
# Configure no .env ou exporte:
export SUPABASE_ACCESS_TOKEN="seu_token_supabase"

# Opcionalmente, force o projeto:
export SUPABASE_PROJECT_ID="xxxxxx"

npm run supabase:types
```

Se `SUPABASE_PROJECT_ID` não for informado, o script extrai o ID de `VITE_SUPABASE_URL`.

---

## Modo Offline / PWA

O InsaneFit adota uma estratégia **local-first**:

1. **Escrita imediata** — toda operação é salva no `localStorage` instantaneamente.
2. **Fila offline** — se online, sincroniza com Supabase. Se offline, entra na fila persistente (`offlineSyncQueue`).
3. **Retry automático** — quando a conexão retorna, a fila é processada com tentativa periódica.
4. **Resolução de conflitos** — last-write-wins com merge inteligente por `updated_at`.

### Operações na fila offline

| Tipo | Descrição |
|---|---|
| `student.create` | Criação de aluno |
| `student.update` | Atualização de aluno |
| `student.delete` | Remoção de aluno |
| `session.create` | Criação de sessão |
| `session.update` | Atualização de sessão |
| `workout.save` | Salvamento de ficha de treino |

### PWA

- Service worker ativo em produção (`public/sw.js`)
- Manifest em `public/manifest.webmanifest`
- Instalável na tela inicial (Android/iOS)
- Persistência adicional via `IndexedDB` para resiliência offline ampliada

```bash
# Verificar configuração PWA
npm run pwa:check
```

---

## Testes

```bash
# Todos os testes (uma vez)
npm run test:run

# Modo watch (desenvolvimento)
npm run test

# Relatório de cobertura
npm run test:coverage
```

### Módulos testados

| Arquivo de teste | Cobertura |
|---|---|
| `workoutProtocol.test.ts` | Normalização de rotinas e dias |
| `studentUtils.test.ts` | Formatação de dados de alunos |
| `idle.test.ts` | Detecção de inatividade do usuário |
| `formSchemas.test.ts` | Validação Zod de formulários |
| `offlineSyncQueue.test.ts` | Enqueue, flush e deduplicação |
| `paymentStore.test.ts` | Lógica de status financeiro |
| `AppErrorBoundary.test.tsx` | Renderização de fallback em erros |
| `smoke.test.tsx` | Renderização do App sem crash |

---

## Billing / Planos

O app suporta três planos de assinatura:

| Plano | Limite de alunos | Preço |
|---|---|---|
| **Free** | Limitado | Grátis |
| **Pro** | Expandido | Mensal |
| **Studio** | Ilimitado | Mensal |

- Limite de alunos aplicado no momento do cadastro.
- Perfil de assinatura salvo em `trainer_profiles`.
- Botão de checkout integrado com Stripe via Edge Functions.

### Ativar pagamento Stripe

1. Publicar a edge function `create-checkout-session`.
2. Publicar a edge function `stripe-webhook`.
3. Configurar secrets Stripe/Supabase.
4. Criar endpoint webhook no Stripe apontando para `stripe-webhook`.
5. Validar no Stripe sandbox: checkout, atualização, cancelamento e renovação.

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

---

## Segurança

- **Row Level Security (RLS)** — isolamento de dados por `auth.uid()` para cada personal trainer.
- **RBAC** — roles `trainer`, `student` e `admin` via tabela `user_roles`.
- **Trigger automático** — novos usuários recebem role `trainer` via trigger no banco.
- **Portal do aluno** — acesso restrito ao próprio treino e agenda vinculados via `share_code` e `student_user_id`.
- **Validação Zod** — todos os dados do Supabase são validados antes de entrar no estado da aplicação.
- **Credenciais via env** — nenhuma chave hard-coded no código.
- O `share_code` é gerado automaticamente no banco (Supabase/Postgres).

---

## Deploy

### Plataformas recomendadas

| Plataforma | Configuração |
|---|---|
| **Vercel** | Deploy automático via GitHub (CI/CD já configurado) |
| **Netlify** | Adicionar `_redirects` com `/* /index.html 200` |
| **Cloudflare Pages** | Edge CDN global, configurar SPA redirect |

> **Importante**: o app usa navegação client-side. Garanta que todas as rotas retornem `index.html` (fallback SPA).

---

## Documentação Adicional

- Guia de contribuição: `CONTRIBUTING.md`
- Arquitetura detalhada: `docs/architecture.md`
- Variáveis de ambiente: `docs/environment-variables.md`
- Matriz RBAC: `docs/rbac-matrix.md`
