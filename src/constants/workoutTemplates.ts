export type WorkoutTemplate = {
  id: string
  label: string
  goal: string
  exerciseNames: string[]
}

export const workoutTemplates: WorkoutTemplate[] = [
  {
    id: 'hipertrofia-iniciante',
    label: 'Hipertrofia iniciante',
    goal: 'Treino simples para alunos em adaptacao',
    exerciseNames: [
      'Supino Reto (Barra)',
      'Puxada Aberta (Pulldown)',
      'Agachamento Livre (Barra)',
      'Desenvolvimento com Halteres',
      'Rosca Alternada (Halter)',
      'Triceps na Polia Alta (Cordas)',
      'Crunch Abdominal',
    ],
  },
  {
    id: 'emagrecimento',
    label: 'Emagrecimento',
    goal: 'Circuito metabolico com cardio e compostos',
    exerciseNames: [
      'Avanco (Lunge) com Halteres',
      'Remada Curvada (Barra)',
      'Flexao de Bracos',
      'Kettlebell Swing',
      'Bicicleta Ergometrica',
      'Mountain Climbers',
      'Prancha (Plank)',
    ],
  },
  {
    id: 'abc-classico',
    label: 'ABC classico',
    goal: 'Divisao tradicional para hipertrofia',
    exerciseNames: [
      'Supino Inclinado (Halter)',
      'Crossover (Cabos)',
      'Remada Sentada (Cabos)',
      'Puxada Fechada (Triangulo)',
      'Agachamento Smith',
      'Leg Press 45°',
      'Hip Thrust (Barra)',
      'Panturrilha na Leg Press',
    ],
  },
  {
    id: 'full-body',
    label: 'Full body',
    goal: 'Sessao completa em 45-60 min',
    exerciseNames: [
      'Agachamento com Peso Corporal',
      'Supino Reto (Halter)',
      'Remada Unilateral (Halter)',
      'Desenvolvimento na Maquina',
      'Stiff com Halteres',
      'Rosca Martelo (Halter)',
      'Triceps Testa (Halter)',
      'Prancha Lateral',
    ],
  },
]
