import { z } from 'zod'

export const studentFormSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do aluno.').max(120, 'Nome muito grande.'),
  sex: z.string().trim().min(1, 'Informe o sexo.'),
  trainingLevel: z.string().trim().min(1, 'Informe o nivel de treino.'),
  workoutType: z.string().trim().min(1, 'Informe o tipo de treino.'),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\d{0,15}$/, 'WhatsApp invalido. Use apenas numeros.')
    .optional()
    .or(z.literal('')),
  validityDays: z.number().int().min(1, 'Validade invalida.').max(3650, 'Validade invalida.'),
})

export const sessionFormSchema = z.object({
  studentId: z.string().trim().min(1, 'Selecione um aluno.'),
  day: z.string().trim().min(1, 'Selecione o dia da aula.'),
  time: z.string().trim().min(1, 'Selecione o horario da aula.'),
  focus: z.string().trim().min(1, 'Informe o foco da aula.').max(200, 'Foco muito grande.'),
  duration: z.number().int().min(5, 'Duracao minima: 5 min.').max(300, 'Duracao maxima: 300 min.'),
})

export const workoutSaveSchema = z.object({
  studentId: z.string().trim().min(1, 'Selecione um aluno para salvar o treino.'),
  workout: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'Todo exercicio precisa de nome.'),
        sets: z.string().trim().min(1, 'Todo exercicio precisa de series.'),
      }),
    )
    .max(250, 'Limite de 250 exercicios por treino.'),
})
