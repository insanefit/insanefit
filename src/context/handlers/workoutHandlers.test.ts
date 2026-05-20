import { describe, it, expect, vi } from 'vitest'
import { createWorkoutHandlers } from './workoutHandlers'

const makeDeps = (overrides: Record<string, unknown> = {}) => ({
  mergedExerciseLibrary: [],
  exerciseVideoMap: {},
  demoExercise: null,
  videoAttachmentForm: { rawUrl: '', licenseLabel: '', notes: '' },
  batchVideoInput: '',
  selectedStudent: null,
  workoutDraft: [],
  quickProtocolForm: { workSets: '3', workReps: '8-12', workRpe: '8', rest: '75s' },
  quickAddExerciseName: '',
  manualExerciseForm: { name: '', muscleGroup: '', category: '', equipment: '' },
  selectedStudentId: '',
  currentUser: null,
  hasSupabaseCredentials: false,
  setVideoAttachmentForm: vi.fn(),
  setDemoExercise: vi.fn(),
  setDemoModelIndex: vi.fn(),
  setExerciseVideoMap: vi.fn(),
  setExerciseVideoCloudStatus: vi.fn(),
  setSyncMessage: vi.fn(),
  setRapidApiImporting: vi.fn(),
  setBatchVideoSaving: vi.fn(),
  setBatchVideoInput: vi.fn(),
  setWorkoutDraft: vi.fn(),
  setEditingDraftExerciseId: vi.fn(),
  setWorkoutBuilderStep: vi.fn(),
  setQuickAddExerciseName: vi.fn(),
  setManualExerciseForm: vi.fn(),
  setTrainerData: vi.fn(),
  syncSaveWorkoutRemote: vi.fn(async () => ({ ok: true, message: 'ok' })),
  createId: vi.fn(() => 'w-test-1'),
  ...overrides,
} as unknown as Parameters<typeof createWorkoutHandlers>[0])

describe('createWorkoutHandlers', () => {
  it('returns all expected handler functions', () => {
    const handlers = createWorkoutHandlers(makeDeps())
    expect(handlers.handleOpenExerciseDemo).toBeTypeOf('function')
    expect(handlers.handleSaveVideoAttachment).toBeTypeOf('function')
    expect(handlers.handleRemoveVideoAttachment).toBeTypeOf('function')
    expect(handlers.handleApplyWorkoutTemplate).toBeTypeOf('function')
    expect(handlers.handleApplyQuickProtocol).toBeTypeOf('function')
    expect(handlers.handleAddExerciseToDraft).toBeTypeOf('function')
    expect(handlers.handleQuickAddExercise).toBeTypeOf('function')
    expect(handlers.handleRemoveDraftExercise).toBeTypeOf('function')
    expect(handlers.handleUpdateDraftExercise).toBeTypeOf('function')
    expect(handlers.handleSaveWorkoutDraft).toBeTypeOf('function')
    expect(handlers.handleClearStudentWorkout).toBeTypeOf('function')
    expect(handlers.handleAddManualExercise).toBeTypeOf('function')
  })

  describe('handleSaveVideoAttachment', () => {
    it('shows message when no demo exercise selected', async () => {
      const deps = makeDeps({ demoExercise: null })
      const { handleSaveVideoAttachment } = createWorkoutHandlers(deps)
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>
      await handleSaveVideoAttachment(event)
      expect(deps.setSyncMessage).toHaveBeenCalledWith('Escolha um exercicio para anexar video.')
    })

    it('shows message when URL is empty', async () => {
      const demoExercise = { id: 'e1', name: 'Supino', muscleGroup: 'Peito', category: 'Composto', equipment: 'Barra' }
      const deps = makeDeps({ demoExercise, videoAttachmentForm: { rawUrl: '', licenseLabel: '', notes: '' } })
      const { handleSaveVideoAttachment } = createWorkoutHandlers(deps)
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>
      await handleSaveVideoAttachment(event)
      expect(deps.setSyncMessage).toHaveBeenCalledWith('Cole uma URL de video para este exercicio.')
    })
  })

  describe('handleRemoveVideoAttachment', () => {
    it('does nothing when no demo exercise', async () => {
      const deps = makeDeps({ demoExercise: null })
      const { handleRemoveVideoAttachment } = createWorkoutHandlers(deps)
      await handleRemoveVideoAttachment()
      expect(deps.setSyncMessage).not.toHaveBeenCalled()
    })
  })

  describe('handleApplyWorkoutTemplate', () => {
    it('shows message when no student selected', () => {
      const deps = makeDeps({ selectedStudent: null })
      const { handleApplyWorkoutTemplate } = createWorkoutHandlers(deps)
      handleApplyWorkoutTemplate({ id: 't1', label: 'PPL', goal: 'Hipertrofia', exerciseNames: [] })
      expect(deps.setSyncMessage).toHaveBeenCalledWith('Selecione um aluno para aplicar um template.')
    })
  })

  describe('handleApplyQuickProtocol', () => {
    it('shows message when draft is empty', () => {
      const deps = makeDeps({ workoutDraft: [] })
      const { handleApplyQuickProtocol } = createWorkoutHandlers(deps)
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>
      handleApplyQuickProtocol(event)
      expect(deps.setSyncMessage).toHaveBeenCalledWith('Adicione exercicios antes de aplicar ajuste rapido.')
    })
  })

  describe('handleQuickAddExercise', () => {
    it('shows message when name is empty', () => {
      const deps = makeDeps({ quickAddExerciseName: '' })
      const { handleQuickAddExercise } = createWorkoutHandlers(deps)
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>
      handleQuickAddExercise(event)
      expect(deps.setSyncMessage).toHaveBeenCalledWith('Digite o nome de um exercicio para adicionar.')
    })

    it('shows message when exercise not found', () => {
      const deps = makeDeps({ quickAddExerciseName: 'NotARealExercise', mergedExerciseLibrary: [] })
      const { handleQuickAddExercise } = createWorkoutHandlers(deps)
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>
      handleQuickAddExercise(event)
      expect(deps.setSyncMessage).toHaveBeenCalledWith('Exercicio nao encontrado na biblioteca.')
    })
  })

  describe('handleSaveWorkoutDraft', () => {
    it('shows message when no student selected', async () => {
      const deps = makeDeps({ selectedStudentId: '' })
      const { handleSaveWorkoutDraft } = createWorkoutHandlers(deps)
      await handleSaveWorkoutDraft()
      expect(deps.setSyncMessage).toHaveBeenCalledWith('Selecione um aluno para montar o treino.')
    })
  })

  describe('handleClearStudentWorkout', () => {
    it('shows message when no student selected', async () => {
      const deps = makeDeps({ selectedStudentId: '' })
      const { handleClearStudentWorkout } = createWorkoutHandlers(deps)
      await handleClearStudentWorkout()
      expect(deps.setSyncMessage).toHaveBeenCalledWith('Selecione um aluno para limpar a ficha.')
    })
  })

  describe('handleAddManualExercise', () => {
    it('shows message when name is empty', () => {
      const deps = makeDeps({ manualExerciseForm: { name: '', muscleGroup: '', category: '', equipment: '' } })
      const { handleAddManualExercise } = createWorkoutHandlers(deps)
      const event = { preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>
      handleAddManualExercise(event)
      expect(deps.setSyncMessage).toHaveBeenCalledWith('Informe o nome do exercicio manual.')
    })
  })
})
