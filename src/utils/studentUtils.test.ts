import { describe, expect, it } from 'vitest'
import {
  buildStudentFormFromStudent,
  getStudentSex,
  getStudentTrainingLevel,
  getStudentWorkoutType,
} from './studentUtils'
import type { Student } from '../types/trainer'

const baseStudent: Student = {
  id: 's-1',
  name: 'Aluno Teste',
  objective: 'Hipertrofia',
  adherence: 70,
  streak: 0,
  nextSession: 'SEG 08:00',
  plan: 'Intermediario',
}

describe('studentUtils', () => {
  it('prioriza campos normalizados ao exibir sexo, nivel e tipo', () => {
    const student: Student = {
      ...baseStudent,
      sex: 'Feminino',
      trainingLevel: 'Avancado',
      workoutType: 'Emagrecimento',
    }

    expect(getStudentSex(student)).toBe('Feminino')
    expect(getStudentTrainingLevel(student)).toBe('Avancado')
    expect(getStudentWorkoutType(student)).toBe('Emagrecimento')
  })

  it('nao usa valor invalido de agenda como sexo', () => {
    const student: Student = {
      ...baseStudent,
      sex: undefined,
      nextSession: 'DIA 10 - 08h',
    }

    expect(getStudentSex(student)).toBe('Nao informado')
  })

  it('mantem compatibilidade legada quando plan e objetivo sao validos', () => {
    const student: Student = {
      ...baseStudent,
      trainingLevel: undefined,
      workoutType: undefined,
      plan: 'Iniciante',
      objective: 'Resistencia',
    }

    expect(getStudentTrainingLevel(student)).toBe('Iniciante')
    expect(getStudentWorkoutType(student)).toBe('Resistencia')
  })

  it('preenche formulario sem herdar lixo de campos legados', () => {
    const student: Student = {
      ...baseStudent,
      sex: undefined,
      trainingLevel: undefined,
      workoutType: undefined,
      nextSession: '08h',
      plan: 'Treino A',
      objective: '',
    }

    const form = buildStudentFormFromStudent(student)

    expect(form.sex).toBe('Masculino')
    expect(form.trainingLevel).toBe('Iniciante')
    expect(form.workoutType).toBe('Hipertrofia')
  })
})

