import { describe, expect, it } from 'vitest'
import { sessionFormSchema, studentFormSchema, workoutSaveSchema } from './formSchemas'

describe('formSchemas', () => {
  it('valida formulario de aluno com sucesso', () => {
    const parsed = studentFormSchema.safeParse({
      name: 'Joao',
      sex: 'Masculino',
      trainingLevel: 'Iniciante',
      workoutType: 'Hipertrofia',
      whatsapp: '5591999999999',
      monthlyFee: 120,
      dueDay: 10,
    })

    expect(parsed.success).toBe(true)
  })

  it('bloqueia formulario de aluno sem nome', () => {
    const parsed = studentFormSchema.safeParse({
      name: '',
      sex: 'Masculino',
      trainingLevel: 'Iniciante',
      workoutType: 'Hipertrofia',
      whatsapp: '',
      monthlyFee: 120,
      dueDay: 10,
    })

    expect(parsed.success).toBe(false)
  })

  it('valida formulario de aula', () => {
    const parsed = sessionFormSchema.safeParse({
      studentId: 's1',
      day: 'seg',
      time: '07:00',
      focus: 'Peito e ombro',
      duration: 60,
    })

    expect(parsed.success).toBe(true)
  })

  it('bloqueia treino sem studentId', () => {
    const parsed = workoutSaveSchema.safeParse({
      studentId: '',
      workout: [{ name: 'Supino', sets: '3x10' }],
    })

    expect(parsed.success).toBe(false)
  })
})

