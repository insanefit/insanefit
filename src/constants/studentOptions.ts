export const studentSexOptions = ['Masculino', 'Feminino', 'Outro'] as const

export const studentTrainingLevelOptions = ['Iniciante', 'Intermediario', 'Avancado'] as const

export const studentWorkoutTypeOptions = [
  'Hipertrofia',
  'Emagrecimento',
  'Forca',
  'Condicionamento',
  'Reabilitacao',
  'Funcional',
] as const

export const defaultStudentForm = {
  name: '',
  sex: 'Masculino',
  trainingLevel: 'Iniciante',
  workoutType: 'Hipertrofia',
  whatsapp: '',
  monthlyFee: '0',
  dueDay: '10',
  pixKey: '',
}
