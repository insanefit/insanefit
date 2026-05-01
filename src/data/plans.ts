import type { PlanDefinition, PlanId } from '../types/billing'

export const planDefinitions: PlanDefinition[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    description: 'Para personal iniciando no digital.',
    studentLimit: 5,
    highlight: 'Comece sem custo',
    features: [
      'Ate 5 alunos ativos',
      'Agenda semanal',
      'Cadastro de treinos basico',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 49,
    description: 'Para personal em fase de crescimento.',
    studentLimit: 40,
    highlight: 'Mais vendido',
    features: [
      'Ate 40 alunos ativos',
      'Relatorios de adesao',
      'Suporte de cobranca recorrente',
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    monthlyPrice: 129,
    description: 'Para equipe e operacao multi-profissional.',
    studentLimit: null,
    highlight: 'Escala sem limite',
    features: [
      'Alunos ilimitados',
      'Multi coach e operacao',
      'Prioridade para integracoes',
    ],
  },
]

export const getPlanDefinition = (id: PlanId): PlanDefinition =>
  planDefinitions.find((plan) => plan.id === id) ?? planDefinitions[0]
