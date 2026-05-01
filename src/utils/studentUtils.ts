import {
  defaultStudentForm,
  studentSexOptions,
  studentTrainingLevelOptions,
  studentWorkoutTypeOptions,
} from '../constants/studentOptions'
import type { Student } from '../types/trainer'

/** Normaliza string para comparacao case-insensitive sem acento. */
export const normalizeLookup = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

/** Encontra a opcao canonica da lista que corresponde ao valor salvo. */
export const findMatchingOption = (
  value: string | undefined,
  options: readonly string[],
): string | undefined => {
  if (!value) return undefined
  const normalizedValue = normalizeLookup(value)
  return options.find((option) => normalizeLookup(option) === normalizedValue)
}

export const getStudentSex = (student: Student): string =>
  findMatchingOption(student.sex, studentSexOptions) ??
  findMatchingOption(student.nextSession, studentSexOptions) ??
  'Nao informado'

export const getStudentTrainingLevel = (student: Student): string =>
  findMatchingOption(student.trainingLevel, studentTrainingLevelOptions) ??
  findMatchingOption(student.plan, studentTrainingLevelOptions) ??
  'Nao informado'

export const getStudentWorkoutType = (student: Student): string =>
  student.workoutType?.trim() || student.objective.trim() || 'Nao informado'

/** Preenche o formulario de edicao a partir dos dados persistidos do aluno. */
export const buildStudentFormFromStudent = (student: Student) => ({
  name: student.name,
  sex:
    findMatchingOption(student.sex, studentSexOptions) ??
    findMatchingOption(student.nextSession, studentSexOptions) ??
    defaultStudentForm.sex,
  trainingLevel:
    findMatchingOption(student.trainingLevel, studentTrainingLevelOptions) ??
    findMatchingOption(student.plan, studentTrainingLevelOptions) ??
    defaultStudentForm.trainingLevel,
  workoutType:
    findMatchingOption(student.workoutType, studentWorkoutTypeOptions) ??
    findMatchingOption(student.objective, studentWorkoutTypeOptions) ??
    defaultStudentForm.workoutType,
  whatsapp: student.whatsapp?.trim() ?? '',
  monthlyFee: String(student.monthlyFee ?? 0),
  dueDay: String(student.dueDay ?? 10),
  pixKey: student.pixKey?.trim() ?? '',
})
