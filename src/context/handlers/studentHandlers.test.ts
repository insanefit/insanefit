import { describe, it, expect, vi } from 'vitest'
import { createStudentHandlers } from './studentHandlers'

// Minimal mock deps factory
const makeDeps = (overrides: Record<string, unknown> = {}) => ({
  billingProfile: { plan: 'free' as const, createdAt: '' },
  activePlanName: 'Free',
  students: [],
  selectedStudent: null,
  studentForm: { name: '', sex: '', trainingLevel: '', workoutType: '', whatsapp: '', validityDays: '30' },
  studentEditForm: { name: '', sex: '', trainingLevel: '', workoutType: '', whatsapp: '', validityDays: '30' },
  sessionForm: { studentId: '', day: '', time: '', focus: '', duration: 60 },
  editingSessionId: null,
  sessions: [],
  currentUser: null,
  hasSupabaseCredentials: false,
  studentPortal: null,
  defaultStudentForm: { name: '', sex: '', trainingLevel: '', workoutType: '', whatsapp: '', validityDays: '30' },
  buildStudentFormFromStudent: vi.fn(() => ({ name: '', sex: '', trainingLevel: '', workoutType: '', whatsapp: '', validityDays: '30' })),
  createId: vi.fn(() => 's-test-1'),
  syncCreateStudentRemote: vi.fn(async () => ({ savedStudent: null, exercisesSaved: false })),
  syncUpdateStudentRemote: vi.fn(async () => false),
  setSyncMessage: vi.fn(),
  setTrainerData: vi.fn(),
  setDoneSessions: vi.fn(),
  setProgressHistory: vi.fn(),
  setSelectedStudentId: vi.fn(),
  setEditingStudent: vi.fn(),
  setSessionForm: vi.fn(),
  setEditingSessionId: vi.fn(),
  setStudentForm: vi.fn(),
  setStudentEditForm: vi.fn(),
  setStudentPortal: vi.fn(),
  setAppMode: vi.fn(),
  ...overrides,
} as unknown as Parameters<typeof createStudentHandlers>[0])

describe('createStudentHandlers', () => {
  it('returns all expected handler functions', () => {
    const handlers = createStudentHandlers(makeDeps())
    expect(handlers.handleCreateStudent).toBeTypeOf('function')
    expect(handlers.handleStartStudentEdit).toBeTypeOf('function')
    expect(handlers.handleCancelStudentEdit).toBeTypeOf('function')
    expect(handlers.handleUpdateStudent).toBeTypeOf('function')
    expect(handlers.handleCreateSession).toBeTypeOf('function')
    expect(handlers.handleStartSessionEdit).toBeTypeOf('function')
    expect(handlers.handleCancelSessionEdit).toBeTypeOf('function')
    expect(handlers.handleCopyStudentCode).toBeTypeOf('function')
    expect(handlers.handleShareStudentAccessLink).toBeTypeOf('function')
    expect(handlers.handleUnlinkStudentAccess).toBeTypeOf('function')
    expect(handlers.handleDeleteStudent).toBeTypeOf('function')
  })

  describe('handleCopyStudentCode', () => {
    it('shows message when no shareCode', async () => {
      const deps = makeDeps()
      const { handleCopyStudentCode } = createStudentHandlers(deps)
      await handleCopyStudentCode(undefined)
      expect(deps.setSyncMessage).toHaveBeenCalledWith('Esse aluno ainda nao tem codigo de acesso.')
    })
  })

  describe('handleStartStudentEdit', () => {
    it('does nothing when no selectedStudent', () => {
      const deps = makeDeps({ selectedStudent: null })
      const { handleStartStudentEdit } = createStudentHandlers(deps)
      handleStartStudentEdit()
      expect(deps.setEditingStudent).not.toHaveBeenCalled()
    })

    it('sets editing state with form from student', () => {
      const student = { id: 's1', name: 'Test' }
      const deps = makeDeps({ selectedStudent: student })
      const { handleStartStudentEdit } = createStudentHandlers(deps)
      handleStartStudentEdit()
      expect(deps.setEditingStudent).toHaveBeenCalledWith(true)
      expect(deps.buildStudentFormFromStudent).toHaveBeenCalledWith(student)
    })
  })

  describe('handleCancelStudentEdit', () => {
    it('resets editing to false', () => {
      const deps = makeDeps()
      const { handleCancelStudentEdit } = createStudentHandlers(deps)
      handleCancelStudentEdit()
      expect(deps.setEditingStudent).toHaveBeenCalledWith(false)
    })
  })

  describe('handleStartSessionEdit', () => {
    it('populates session form from existing session', () => {
      const sessions = [{ id: 'a1', day: 'Seg', time: '08:00', studentId: 's1', focus: 'Peito', duration: 60, updatedAt: '' }]
      const deps = makeDeps({ sessions })
      const { handleStartSessionEdit } = createStudentHandlers(deps)
      handleStartSessionEdit('a1')
      expect(deps.setSessionForm).toHaveBeenCalledWith({
        studentId: 's1', day: 'Seg', time: '08:00', focus: 'Peito', duration: 60,
      })
      expect(deps.setEditingSessionId).toHaveBeenCalledWith('a1')
    })

    it('does nothing for nonexistent session', () => {
      const deps = makeDeps()
      const { handleStartSessionEdit } = createStudentHandlers(deps)
      handleStartSessionEdit('nonexistent')
      expect(deps.setSessionForm).not.toHaveBeenCalled()
    })
  })

  describe('handleCancelSessionEdit', () => {
    it('resets session form and clears editing', () => {
      const deps = makeDeps()
      const { handleCancelSessionEdit } = createStudentHandlers(deps)
      handleCancelSessionEdit()
      expect(deps.setEditingSessionId).toHaveBeenCalledWith(null)
    })
  })

  describe('handleDeleteStudent', () => {
    it('shows message when no student selected', async () => {
      const deps = makeDeps({ selectedStudent: null })
      const { handleDeleteStudent } = createStudentHandlers(deps)
      await handleDeleteStudent()
      expect(deps.setSyncMessage).toHaveBeenCalledWith('Selecione um aluno para excluir.')
    })
  })

  describe('handleUnlinkStudentAccess', () => {
    it('shows message when student not linked', async () => {
      const deps = makeDeps({ students: [{ id: 's1', name: 'T', studentUserId: null }] })
      const { handleUnlinkStudentAccess } = createStudentHandlers(deps)
      await handleUnlinkStudentAccess('s1')
      expect(deps.setSyncMessage).toHaveBeenCalledWith('Esse aluno nao esta vinculado a nenhuma conta.')
    })
  })
})
