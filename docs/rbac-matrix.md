# RBAC Matrix (Insane Fit)

## Roles

- `trainer`: dono do workspace, gerencia alunos/treinos/agenda/financeiro.
- `student`: acesso somente ao proprio portal.
- `admin`: auditoria e suporte operacional com override.

## Tabelas e acesso

| Tabela | trainer | student | admin |
|---|---|---|---|
| `students` | CRUD apenas dos proprios alunos | leitura do proprio cadastro vinculado | leitura/gestao global |
| `sessions` | CRUD das sessoes dos proprios alunos | leitura das sessoes do proprio treino | leitura/gestao global |
| `exercises` | CRUD dos exercicios dos proprios alunos | leitura dos exercicios do proprio treino | leitura/gestao global |
| `exercise_videos` | CRUD dos proprios anexos | sem acesso direto | leitura/gestao global |
| `trainer_profiles` | CRUD do proprio perfil | sem acesso direto | leitura/gestao global |
| `student_payments` | CRUD do proprio financeiro por aluno | leitura do proprio financeiro | leitura/gestao global |
| `user_roles` | leitura das proprias roles | leitura das proprias roles | gestao de roles |

## Funcoes RPC

- `claim_student_access(code)`: vincula aluno por codigo e atribui role `student`.
- `save_student_workout_atomic(...)`: grava treino completo de forma atomica.
- `sync_student_progress_atomic(...)`: marca sessao + progresso atomico.
- `upsert_student_payment(...)`: atualiza pagamento/pix no mes atual de forma segura.
- `get_student_portal_finance()`: expoe snapshot financeiro seguro para o aluno.

## Checklist de seguranca

- [x] RLS habilitado nas tabelas centrais.
- [x] Policies com escopo por `auth.uid()` e override `admin`.
- [x] Funcoes criticas com `security definer` e validacao de ownership.
- [x] Trigger para role default `trainer` em novos usuarios.
- [x] Vinculo de aluno concede role `student`.
