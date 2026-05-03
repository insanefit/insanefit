# Contributing to Insane Fit

Obrigado por contribuir com o Insane Fit.

## Requisitos

- Node.js 20+
- npm 10+

## Setup local

```bash
npm install
cp .env.example .env
npm run dev
```

## Fluxo de branch

- `main`: producao
- `dev`: integracao e homologacao
- feature branches: `feat/nome-curto`, `fix/nome-curto`, `chore/nome-curto`

## Padrao de commit

Use Conventional Commits:

- `feat: ...`
- `fix: ...`
- `chore: ...`
- `docs: ...`
- `test: ...`

## Checklist antes de abrir PR

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

## Pull Request

- Explique o problema e a solucao.
- Inclua screenshots quando houver mudanca visual.
- Se houver migracao SQL, cite o arquivo em `supabase/`.
- Evite PRs gigantes; prefira mudancas pequenas e revisaveis.

## Banco e seguranca

- Nunca commitar chaves reais no repo.
- Sempre manter RLS habilitado nas tabelas do Supabase.
- Quando alterar regras de acesso, atualizar `docs/rbac-matrix.md`.

## Documentacao

Ao mudar arquitetura, variaveis de ambiente ou fluxo de deploy, atualize:

- `README.md`
- `docs/architecture.md`
- `docs/environment-variables.md`
