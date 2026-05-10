import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useMetaContext, useTrainerContext, useWorkoutContext } from '../../context/appContextStore'
import { getExerciseVideoAttachment } from '../../utils/exerciseUtils'
import { normalizeWorkoutDay, normalizeWorkoutRoutine } from '../../utils/workoutProtocol'

const extractYoutubeVideoId = (value: string): string | null => {
  const raw = value.trim()
  if (!raw) return null
  const embedMatch = raw.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/)
  if (embedMatch?.[1]) return embedMatch[1]
  const watchMatch = raw.match(/[?&]v=([a-zA-Z0-9_-]{6,})/)
  if (watchMatch?.[1]) return watchMatch[1]
  const shortMatch = raw.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/)
  if (shortMatch?.[1]) return shortMatch[1]
  return null
}

const buildYoutubeThumbUrl = (videoId: string): string => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
type ProtocolMode = 'padrao' | 'cluster' | 'myo' | 'cluster_myo'

export function WorkoutView() {
  const {
    students, sessions, selectedStudent, selectedStudentId, setSelectedStudentId,
    setEditingStudent,
    syncMessage,
    setSyncMessage,
  } = useTrainerContext()
  const {
    workoutDraft,
    setWorkoutDraft,
    workoutBuilderOpen,
    setWorkoutBuilderOpen,
    workoutBuilderStep,
    setWorkoutBuilderStep,
    workoutBuilderMode,
    setWorkoutBuilderMode,
    editingDraftExerciseId,
    setEditingDraftExerciseId,
    handleSaveWorkoutDraft,
    handleClearStudentWorkout,
    handleApplyWorkoutTemplate,
    handleAddExerciseToDraft,
    handleRemoveDraftExercise,
    handleUpdateDraftExercise,
    handleQuickAddExercise,
    handleAddManualExercise,
    handleOpenExerciseDemo,
    quickAddExerciseName,
    setQuickAddExerciseName,
    manualExerciseForm,
    setManualExerciseForm,
    exerciseQuery,
    setExerciseQuery,
    groupFilter,
    setGroupFilter,
    categoryFilter,
    setCategoryFilter,
    equipmentFilter,
    setEquipmentFilter,
    difficultyFilter,
    setDifficultyFilter,
    sourceFilter,
    setSourceFilter,
    filteredExercises,
    quickAddExercises,
    categoryOptions,
    equipmentOptions,
    sourceSummary,
    demoExercise,
    activeDemoOption,
    videoAttachmentForm,
    setVideoAttachmentForm,
    rapidApiImporting,
    exerciseVideoCloudStatus,
    exerciseVideoMap,
    handleSaveVideoAttachment,
    handleRemoveVideoAttachment,
    handleImportVideosFromExerciseDb,
  } = useWorkoutContext()
  const {
    workoutDraftGroups,
    selectedStudentWorkoutCount,
    renderDemoMedia,
    muscleGroups,
    mergedExerciseLibrary,
    workoutTemplates,
    hasSupabaseCredentials,
    weekDays,
    getExerciseDisplayName,
    getStudentTrainingLevel,
    getStudentWorkoutType,
  } = useMetaContext()

  const showingWorkoutLibrary = workoutBuilderStep === 'biblioteca'
  const hasVideoForDemo =
    demoExercise ? Boolean(getExerciseVideoAttachment(demoExercise.name, exerciseVideoMap)) : false
  const [libraryTab, setLibraryTab] = useState<'app' | 'withGif' | 'inDraft'>('app')
  const [libraryPage, setLibraryPage] = useState(1)
  const [showAdvancedLibraryTools, setShowAdvancedLibraryTools] = useState(false)
  const [showManualCreateForm, setShowManualCreateForm] = useState(false)
  const [showPlanningTools, setShowPlanningTools] = useState(false)
  const [collapsedDraftExerciseIds, setCollapsedDraftExerciseIds] = useState<string[]>([])
  const [activeDraftDayChoice, setActiveDraftDayChoice] = useState('')
  const [draftDayFilterChoice, setDraftDayFilterChoice] = useState<'Todos' | string>('Todos')
  const [activeDraftRoutineChoice, setActiveDraftRoutineChoice] = useState('A')
  const [draftRoutineFilterChoice, setDraftRoutineFilterChoice] = useState<'Todos' | string>('Todos')
  const [duplicateSourceRoutine, setDuplicateSourceRoutine] = useState('A')
  const [duplicateTargetRoutine, setDuplicateTargetRoutine] = useState('B')
  const libraryPageSize = 10

  const studentAvailableDays = useMemo(() => {
    if (!selectedStudent) return weekDays
    const days = Array.from(
      new Set(
        sessions
          .filter((session) => session.studentId === selectedStudent.id)
          .map((session) => normalizeWorkoutDay(session.day))
          .filter(Boolean),
      ),
    )
    return days.length > 0 ? days : weekDays
  }, [selectedStudent, sessions, weekDays])
  const activeDraftDay =
    studentAvailableDays.find((day) => day === activeDraftDayChoice) ?? studentAvailableDays[0] ?? ''
  const studentRoutineOptions = useMemo(() => {
    const existing = Array.from(
      new Set(workoutDraft.map((item) => normalizeWorkoutRoutine(item.routine)).filter(Boolean)),
    )
    const defaults = ['A', 'B', 'C', 'D']
    return Array.from(new Set([...defaults, ...existing]))
  }, [workoutDraft])
  const activeDraftRoutine =
    studentRoutineOptions.find((routine) => routine === normalizeWorkoutRoutine(activeDraftRoutineChoice)) ?? 'A'
  const draftDayFilter =
    draftDayFilterChoice === 'Todos' || studentAvailableDays.some((day) => day === draftDayFilterChoice)
      ? draftDayFilterChoice
      : 'Todos'
  const draftRoutineFilter =
    draftRoutineFilterChoice === 'Todos' ||
    studentRoutineOptions.some((routine) => routine === normalizeWorkoutRoutine(draftRoutineFilterChoice))
      ? draftRoutineFilterChoice === 'Todos'
        ? 'Todos'
        : normalizeWorkoutRoutine(draftRoutineFilterChoice)
      : 'Todos'

  const draftNameKeys = useMemo(
    () => new Set(workoutDraft.map((item) => item.name.trim().toLowerCase())),
    [workoutDraft],
  )

  const libraryExercises = useMemo(() => {
    if (libraryTab === 'withGif') {
      return filteredExercises.filter((exercise) => Boolean(getExerciseVideoAttachment(exercise.name, exerciseVideoMap)))
    }
    if (libraryTab === 'inDraft') {
      return filteredExercises.filter((exercise) => draftNameKeys.has(exercise.name.trim().toLowerCase()))
    }
    return filteredExercises
  }, [draftNameKeys, exerciseVideoMap, filteredExercises, libraryTab])

  const videoEnabledCount = useMemo(
    () => filteredExercises.filter((exercise) => Boolean(getExerciseVideoAttachment(exercise.name, exerciseVideoMap))).length,
    [exerciseVideoMap, filteredExercises],
  )
  const draftMatchCount = useMemo(
    () => filteredExercises.filter((exercise) => draftNameKeys.has(exercise.name.trim().toLowerCase())).length,
    [draftNameKeys, filteredExercises],
  )
  const filteredDraft = useMemo(
    () =>
      workoutDraft.filter((item) => {
        const byDay = draftDayFilter === 'Todos' || normalizeWorkoutDay(item.day) === draftDayFilter
        const byRoutine = draftRoutineFilter === 'Todos' || normalizeWorkoutRoutine(item.routine) === draftRoutineFilter
        return byDay && byRoutine
      }),
    [draftDayFilter, draftRoutineFilter, workoutDraft],
  )

  useEffect(() => {
    setCollapsedDraftExerciseIds((current) =>
      current.filter((id) => workoutDraft.some((item) => item.id === id)),
    )
  }, [workoutDraft])

  const handleDuplicateRoutine = () => {
    const sourceRoutine = normalizeWorkoutRoutine(duplicateSourceRoutine)
    const targetRoutine = normalizeWorkoutRoutine(duplicateTargetRoutine)
    if (sourceRoutine === targetRoutine) {
      setSyncMessage('Escolha treinos diferentes para duplicar.')
      return
    }

    const sourceItems = workoutDraft.filter(
      (item) => normalizeWorkoutRoutine(item.routine) === sourceRoutine,
    )
    if (sourceItems.length === 0) {
      setSyncMessage(`Nao existe treino ${sourceRoutine} para duplicar.`)
      return
    }

    const now = Date.now()
    setWorkoutDraft((current) => {
      const withoutTarget = current.filter(
        (item) => normalizeWorkoutRoutine(item.routine) !== targetRoutine,
      )
      const duplicatedItems = sourceItems.map((item, index) => ({
        ...item,
        id: `${item.id}-dup-${targetRoutine}-${now}-${index}`,
        routine: targetRoutine,
      }))
      return [...withoutTarget, ...duplicatedItems]
    })
    setActiveDraftRoutineChoice(targetRoutine)
    setDraftRoutineFilterChoice(targetRoutine)
    setSyncMessage(`Treino ${sourceRoutine} duplicado para treino ${targetRoutine}.`)
  }

  const totalLibraryPages = Math.max(1, Math.ceil(libraryExercises.length / libraryPageSize))
  const safeLibraryPage = Math.min(libraryPage, totalLibraryPages)
  const visibleLibraryExercises = libraryExercises.slice(
    (safeLibraryPage - 1) * libraryPageSize,
    safeLibraryPage * libraryPageSize,
  )

  const visiblePages = useMemo(() => {
    if (totalLibraryPages <= 7) {
      return Array.from({ length: totalLibraryPages }, (_, index) => index + 1)
    }
    const start = Math.max(1, Math.min(safeLibraryPage - 2, totalLibraryPages - 6))
    return Array.from({ length: 7 }, (_, index) => start + index)
  }, [safeLibraryPage, totalLibraryPages])

  const handleClearLibraryFilters = () => {
    setLibraryPage(1)
    setExerciseQuery('')
    setGroupFilter('Todos')
    setCategoryFilter('Todas')
    setEquipmentFilter('Todos')
    setDifficultyFilter('Todos')
    setSourceFilter('Todos')
    setLibraryTab('app')
  }

  const handleOpenManualCreate = () => {
    setWorkoutBuilderStep('protocolo')
    setShowManualCreateForm(true)
  }

  const handleSubmitManualCreate = (event: FormEvent<HTMLFormElement>) => {
    const hasName = manualExerciseForm.name.trim().length > 0
    handleAddManualExercise(event, activeDraftDay, activeDraftRoutine)
    if (hasName) {
      setShowManualCreateForm(false)
    }
  }

  const isExerciseCollapsed = (exerciseId: string) => collapsedDraftExerciseIds.includes(exerciseId)

  const handleEditExerciseVideo = (exercise: (typeof filteredExercises)[number]) => {
    const attachment = getExerciseVideoAttachment(exercise.name, exerciseVideoMap)
    setVideoAttachmentForm({
      rawUrl: attachment?.rawUrl ?? '',
      licenseLabel: attachment?.licenseLabel ?? '',
      notes: attachment?.notes ?? '',
    })
    handleOpenExerciseDemo(exercise)
  }

  const getProtocolMode = (exercise: (typeof workoutDraft)[number]): ProtocolMode => {
    if (exercise.useClusterSet && exercise.useMyoReps) return 'cluster_myo'
    if (exercise.useClusterSet) return 'cluster'
    if (exercise.useMyoReps) return 'myo'
    return 'padrao'
  }

  const applyProtocolMode = (exerciseId: string, mode: ProtocolMode) => {
    setWorkoutDraft((current) =>
      current.map((item) => {
        if (item.id !== exerciseId) return item

        if (mode === 'padrao') {
          return {
            ...item,
            useClusterSet: false,
            useMyoReps: false,
          }
        }

        if (mode === 'cluster') {
          return {
            ...item,
            useClusterSet: true,
            clusterBlocks: item.clusterBlocks.trim() || '3',
            clusterReps: item.clusterReps.trim() || '2-3',
            clusterRest: item.clusterRest.trim() || '20s',
            useMyoReps: false,
          }
        }

        if (mode === 'myo') {
          return {
            ...item,
            useClusterSet: false,
            useMyoReps: true,
            myoMiniSets: item.myoMiniSets.trim() || '3',
            myoMiniReps: item.myoMiniReps.trim() || '3-5',
            myoRest: item.myoRest.trim() || '5s',
          }
        }

        return {
          ...item,
          useClusterSet: true,
          clusterBlocks: item.clusterBlocks.trim() || '3',
          clusterReps: item.clusterReps.trim() || '2-3',
          clusterRest: item.clusterRest.trim() || '20s',
          useMyoReps: true,
          myoMiniSets: item.myoMiniSets.trim() || '3',
          myoMiniReps: item.myoMiniReps.trim() || '3-5',
          myoRest: item.myoRest.trim() || '5s',
        }
      }),
    )
  }

  return (
    <section id="workouts" className="panel">
      <div className="panel-head">
        <div>
          <h3>Construtor de treinos</h3>
          <p>Fluxo simples: selecione aluno, adicione exercicios e salve o protocolo.</p>
        </div>
        {selectedStudent && (
          <button
            type="button"
            className="icon-toggle"
            aria-label={workoutBuilderOpen ? 'Recolher treinos' : 'Abrir treinos'}
            title={workoutBuilderOpen ? 'Recolher treinos' : 'Abrir treinos'}
            onClick={() => setWorkoutBuilderOpen((current) => !current)}
          >
            {workoutBuilderOpen ? '▾' : '▸'}
          </button>
        )}
      </div>

      {students.length > 0 && (
        <div className="workout-student-pick">
          <label className="field-label" htmlFor="workout-student-pick">Aluno da ficha</label>
          <select
            id="workout-student-pick"
            className="field-input"
            value={selectedStudentId}
            onChange={(event) => {
              setSelectedStudentId(event.target.value)
              setEditingStudent(false)
              setActiveDraftDayChoice('')
              setDraftDayFilterChoice('Todos')
              setActiveDraftRoutineChoice('A')
              setDraftRoutineFilterChoice('Todos')
              setDuplicateSourceRoutine('A')
              setDuplicateTargetRoutine('B')
            }}
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} - {getStudentWorkoutType(student)}
              </option>
            ))}
          </select>
        </div>
      )}

      {!selectedStudent && (
        <p className="empty-line">Cadastre e selecione um aluno para montar o treino.</p>
      )}

      {syncMessage && <p className="status-line">{syncMessage}</p>}

      {selectedStudent && !workoutBuilderOpen && (
        <p className="empty-line">
          Construtor de treino recolhido. Clique no icone para expandir.
        </p>
      )}

      {selectedStudent && workoutBuilderOpen && (
        <>
          <div className="workout-summary-strip">
            <div className="summary-block">
              <span>Aluno</span>
              <strong>{selectedStudent.name}</strong>
              <small>{getStudentTrainingLevel(selectedStudent)} • {getStudentWorkoutType(selectedStudent)}</small>
            </div>
            <div className="summary-block">
              <span>Exercicios no rascunho</span>
              <strong>{workoutDraft.length}</strong>
              <small>
                {workoutDraft.length > 0
                  ? workoutDraftGroups.map(([group, count]) => `${group} (${count})`).join(' • ')
                  : 'Adicione exercicios da biblioteca.'}
              </small>
            </div>
            <div className="summary-block">
              <span>Status da ficha</span>
              <strong>{workoutDraft.length > 0 ? 'Pronta para finalizar' : 'Aguardando exercicios'}</strong>
              <small>{selectedStudentWorkoutCount} exercicios no treino salvo atual</small>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSaveWorkoutDraft}
            >
              Finalizar treino
            </button>
          </div>

          <div className="workout-day-strip workout-day-strip-basic">
            <label className="field-label" htmlFor="workout-routine-add">Treino</label>
            <select
              id="workout-routine-add"
              className="field-input"
              value={activeDraftRoutine}
              onChange={(event) => setActiveDraftRoutineChoice(event.target.value)}
            >
              {studentRoutineOptions.map((routine) => (
                <option key={`routine-add-${routine}`} value={routine}>Treino {routine}</option>
              ))}
            </select>

            <label className="field-label" htmlFor="workout-day-add">Dia para adicionar</label>
            <select
              id="workout-day-add"
              className="field-input"
              value={activeDraftDay}
              onChange={(event) => setActiveDraftDayChoice(event.target.value)}
            >
              {studentAvailableDays.map((day) => (
                <option key={`day-add-${day}`} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div className="workout-planning-toggle">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setShowPlanningTools((current) => !current)}
            >
              {showPlanningTools ? 'Ocultar opcoes avancadas' : 'Mostrar opcoes avancadas'}
            </button>
          </div>

          {showPlanningTools && (
            <>
              <div className="workout-day-strip workout-day-strip-filter">
                <label className="field-label" htmlFor="workout-routine-filter">Filtrar treino</label>
                <select
                  id="workout-routine-filter"
                  className="field-input"
                  value={draftRoutineFilter}
                  onChange={(event) => setDraftRoutineFilterChoice(event.target.value)}
                >
                  <option value="Todos">Todos os treinos</option>
                  {studentRoutineOptions.map((routine) => (
                    <option key={`routine-filter-${routine}`} value={routine}>Treino {routine}</option>
                  ))}
                </select>

                <label className="field-label" htmlFor="workout-day-filter">Exibir no protocolo</label>
                <select
                  id="workout-day-filter"
                  className="field-input"
                  value={draftDayFilter}
                  onChange={(event) => setDraftDayFilterChoice(event.target.value)}
                >
                  <option value="Todos">Todos os dias</option>
                  {studentAvailableDays.map((day) => (
                    <option key={`day-filter-${day}`} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="workout-duplicate-strip">
                <label className="field-label" htmlFor="duplicate-source-routine">Duplicar treino</label>
                <select
                  id="duplicate-source-routine"
                  className="field-input"
                  value={duplicateSourceRoutine}
                  onChange={(event) => setDuplicateSourceRoutine(event.target.value)}
                >
                  {studentRoutineOptions.map((routine) => (
                    <option key={`duplicate-source-${routine}`} value={routine}>Treino {routine}</option>
                  ))}
                </select>
                <span className="duplicate-arrow">→</span>
                <select
                  aria-label="Treino destino"
                  className="field-input"
                  value={duplicateTargetRoutine}
                  onChange={(event) => setDuplicateTargetRoutine(event.target.value)}
                >
                  {studentRoutineOptions.map((routine) => (
                    <option key={`duplicate-target-${routine}`} value={routine}>Treino {routine}</option>
                  ))}
                </select>
                <button type="button" className="btn-secondary" onClick={handleDuplicateRoutine}>
                  Duplicar
                </button>
              </div>
            </>
          )}

          <div className="workout-flow-tabs">
            <button
              type="button"
              className={showingWorkoutLibrary ? 'tab-chip active' : 'tab-chip'}
              onClick={() => setWorkoutBuilderStep('biblioteca')}
            >
              1. Biblioteca
            </button>
            <button
              type="button"
              className={!showingWorkoutLibrary ? 'tab-chip active' : 'tab-chip'}
              onClick={() => setWorkoutBuilderStep('protocolo')}
            >
              2. Protocolo ({workoutDraft.length})
            </button>
          </div>

          {showingWorkoutLibrary ? (
            <div className="workout-builder focused">
              <div className="library-column library-column-clean">
                <div className="workout-step-head">
                  <p>Biblioteca limpa: busque, filtre e adicione exercicios com poucos toques.</p>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setWorkoutBuilderStep('protocolo')}
                  >
                    Ir para protocolo ({workoutDraft.length})
                  </button>
                </div>

                <div className="builder-mode-tabs compact">
                  <button
                    type="button"
                    className={workoutBuilderMode === 'simplificado' ? 'tab-chip active' : 'tab-chip'}
                    onClick={() => setWorkoutBuilderMode('simplificado')}
                  >
                    Simplificado
                  </button>
                  <button
                    type="button"
                    className={workoutBuilderMode === 'pro' ? 'tab-chip active' : 'tab-chip'}
                    onClick={() => setWorkoutBuilderMode('pro')}
                  >
                    Pro
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={handleOpenManualCreate}
                  >
                    + Criar manual
                  </button>
                </div>

                <div className="library-controls library-controls-clean">
                  <label className="field-label" htmlFor="exercise-search">Buscar exercicio</label>
                  <input
                    id="exercise-search"
                    className="field-input"
                    value={exerciseQuery}
                    onChange={(event) => {
                      setLibraryPage(1)
                      setExerciseQuery(event.target.value)
                    }}
                    placeholder="Buscar exercicios..."
                  />

                  <div className="library-filter-row">
                    <select
                      aria-label="Filtrar por grupo muscular"
                      className="field-input"
                      value={groupFilter}
                      onChange={(event) => {
                        setLibraryPage(1)
                        setGroupFilter(event.target.value)
                      }}
                    >
                      <option value="Todos">Grupos musculares</option>
                      {muscleGroups.map((group) => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                    <select
                      aria-label="Filtrar por categoria"
                      className="field-input"
                      value={categoryFilter}
                      onChange={(event) => {
                        setLibraryPage(1)
                        setCategoryFilter(event.target.value)
                      }}
                    >
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="library-source-tabs">
                  <button
                    type="button"
                    className={libraryTab === 'app' ? 'tab-chip active' : 'tab-chip'}
                    onClick={() => {
                      setLibraryPage(1)
                      setLibraryTab('app')
                    }}
                  >
                    Exercicios do app ({filteredExercises.length})
                  </button>
                  <button
                    type="button"
                    className={libraryTab === 'withGif' ? 'tab-chip active' : 'tab-chip'}
                    onClick={() => {
                      setLibraryPage(1)
                      setLibraryTab('withGif')
                    }}
                  >
                    Com video ({videoEnabledCount})
                  </button>
                  <button
                    type="button"
                    className={libraryTab === 'inDraft' ? 'tab-chip active' : 'tab-chip'}
                    onClick={() => {
                      setLibraryPage(1)
                      setLibraryTab('inDraft')
                    }}
                  >
                    No treino ({draftMatchCount})
                  </button>
                </div>

                <div className="library-clean-actions">
                  <select
                    aria-label="Filtrar por fonte"
                    className="field-input"
                    value={sourceFilter}
                    onChange={(event) => {
                      setLibraryPage(1)
                      setSourceFilter(event.target.value as 'Todos' | 'core' | 'animatic')
                    }}
                  >
                    <option value="Todos">Todas as fontes</option>
                    <option value="core">Biblioteca base ({sourceSummary.core})</option>
                    <option value="animatic">Exercise Animatic ({sourceSummary.animatic})</option>
                  </select>
                  <button type="button" className="btn-secondary" onClick={handleClearLibraryFilters}>
                    Limpar filtros
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setShowAdvancedLibraryTools((current) => !current)}
                  >
                    {showAdvancedLibraryTools ? 'Ocultar avancado' : 'Mostrar avancado'}
                  </button>
                </div>

                {showAdvancedLibraryTools && (
                  <div className="library-advanced-box">
                    {workoutBuilderMode === 'simplificado' && (
                      <div className="template-strip">
                        <div className="template-strip-head">
                          <strong>Templates prontos</strong>
                          <span>Aplique uma estrutura base com um toque.</span>
                        </div>
                        <div className="template-list">
                          {workoutTemplates.map((template) => (
                            <button
                              key={template.id}
                              type="button"
                              className="template-card"
                              onClick={() => handleApplyWorkoutTemplate(template, activeDraftDay, activeDraftRoutine)}
                            >
                              <strong>{template.label}</strong>
                              <span>{template.goal}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="library-filter-grid">
                      <select
                        aria-label="Filtrar por equipamento"
                        className="field-input"
                        value={equipmentFilter}
                        onChange={(event) => {
                          setLibraryPage(1)
                          setEquipmentFilter(event.target.value)
                        }}
                      >
                        {equipmentOptions.map((equipment) => (
                          <option key={equipment} value={equipment}>{equipment}</option>
                        ))}
                      </select>
                      <select
                        aria-label="Filtrar por nivel"
                        className="field-input"
                        value={difficultyFilter}
                        onChange={(event) => {
                          setLibraryPage(1)
                          setDifficultyFilter(event.target.value as 'Todos' | 'beginner' | 'intermediate' | 'advanced')
                        }}
                      >
                        <option value="Todos">Todos os niveis</option>
                        <option value="beginner">Iniciante</option>
                        <option value="intermediate">Intermediario</option>
                        <option value="advanced">Avancado</option>
                      </select>
                    </div>

                    <form
                      className="quick-add-form"
                      onSubmit={(event) => handleQuickAddExercise(event, activeDraftDay, activeDraftRoutine)}
                    >
                      <label className="field-label" htmlFor="quick-add-exercise">Adicionar rapido</label>
                      <div className="quick-add-input-row">
                        <input
                          id="quick-add-exercise"
                          className="field-input"
                          value={quickAddExerciseName}
                          onChange={(event) => setQuickAddExerciseName(event.target.value)}
                          placeholder="Digite e pressione Enter"
                          list="exercise-name-list"
                        />
                        <datalist id="exercise-name-list">
                          {filteredExercises.slice(0, 100).map((exercise) => (
                            <option key={`quick-${exercise.id}`} value={getExerciseDisplayName(exercise.name)} />
                          ))}
                        </datalist>
                        <button type="submit" className="btn-primary">Add</button>
                      </div>
                    </form>

                    <div className="quick-add-chips">
                      {quickAddExercises.map((exercise) => (
                        <button
                          key={`chip-${exercise.id}`}
                          type="button"
                          className="quick-add-chip"
                          onClick={() => handleAddExerciseToDraft(exercise, activeDraftDay, activeDraftRoutine)}
                        >
                          + {getExerciseDisplayName(exercise.name)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {workoutDraft.length > 0 && (
                  <div className="draft-queue">
                    <div className="draft-queue-head">
                      <strong>Fila do treino ({workoutDraft.length})</strong>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setWorkoutBuilderStep('protocolo')}
                      >
                        Revisar protocolo
                      </button>
                    </div>
                    <div className="draft-queue-list">
                      {workoutDraft.slice(0, 8).map((item, index) => (
                        <span key={`queue-${item.id}`}>
                          {index + 1}. {getExerciseDisplayName(item.name)}
                        </span>
                      ))}
                      {workoutDraft.length > 8 && <span>...e mais {workoutDraft.length - 8} exercicios</span>}
                    </div>
                  </div>
                )}

                <p className="library-count">
                  Mostrando {visibleLibraryExercises.length} de {libraryExercises.length} exercicios filtrados ({mergedExerciseLibrary.length} no total).
                </p>

                <div className="library-list compact-list">
                  {visibleLibraryExercises.map((exercise) => {
                    const attachment = getExerciseVideoAttachment(exercise.name, exerciseVideoMap)
                    const hasVideo = Boolean(attachment)
                    const previewUrl = attachment?.rawUrl || attachment?.embedUrl || ''
                    const canPreviewImage = /\.(gif|png|jpe?g|webp|avif|svg)(\?|#|$)/i.test(previewUrl)
                    const youtubeVideoId = extractYoutubeVideoId(previewUrl)
                    const previewImageUrl = canPreviewImage
                      ? previewUrl
                      : youtubeVideoId
                        ? buildYoutubeThumbUrl(youtubeVideoId)
                        : ''
                    const alreadyInDraft = draftNameKeys.has(exercise.name.trim().toLowerCase())

                    return (
                      <article key={exercise.id} className="library-item mfit-card">
                        <button
                          type="button"
                          className="library-thumb"
                          onClick={() => handleOpenExerciseDemo(exercise)}
                          aria-label={`Abrir video de ${getExerciseDisplayName(exercise.name)}`}
                        >
                          {hasVideo && previewImageUrl ? (
                            <img src={previewImageUrl} alt={`Preview ${getExerciseDisplayName(exercise.name)}`} loading="lazy" />
                          ) : (
                            <span>{hasVideo ? 'Video' : 'Sem video'}</span>
                          )}
                        </button>

                        <div className="library-item-text">
                          <strong>{getExerciseDisplayName(exercise.name)}</strong>
                          <div className="library-pill-row">
                            <span className="library-pill">{exercise.muscleGroup}</span>
                            <span className="library-pill">{exercise.category}</span>
                          </div>
                          <span>{exercise.equipment}</span>
                        </div>

                        <div className="library-actions">
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => handleOpenExerciseDemo(exercise)}
                          >
                            {hasVideo ? 'Ver video' : 'Sem video'}
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => handleEditExerciseVideo(exercise)}
                          >
                            Editar video
                          </button>
                          <button
                            type="button"
                            className={alreadyInDraft ? 'btn-secondary' : 'btn-primary'}
                            onClick={() => handleAddExerciseToDraft(exercise, activeDraftDay, activeDraftRoutine)}
                            disabled={alreadyInDraft}
                          >
                            {alreadyInDraft ? 'Adicionado' : 'Adicionar'}
                          </button>
                        </div>
                      </article>
                    )
                  })}
                  {visibleLibraryExercises.length === 0 && (
                    <p className="empty-line">Nenhum exercicio encontrado com os filtros atuais.</p>
                  )}
                </div>

                {totalLibraryPages > 1 && (
                  <div className="library-pagination">
                    <button
                      type="button"
                      className="tab-chip"
                      onClick={() => setLibraryPage((current) => Math.max(1, Math.min(current, totalLibraryPages) - 1))}
                      disabled={safeLibraryPage === 1}
                    >
                      {'<'}
                    </button>
                    {visiblePages.map((page) => (
                      <button
                        key={`page-${page}`}
                        type="button"
                        className={safeLibraryPage === page ? 'tab-chip active' : 'tab-chip'}
                        onClick={() => setLibraryPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="tab-chip"
                      onClick={() => setLibraryPage((current) => Math.min(totalLibraryPages, Math.min(current, totalLibraryPages) + 1))}
                      disabled={safeLibraryPage === totalLibraryPages}
                    >
                      {'>'}
                    </button>
                  </div>
                )}

                {demoExercise && (
                  <div className="demo-viewer">
                    <div className="demo-head">
                      <strong>Video do exercicio: {getExerciseDisplayName(demoExercise.name)}</strong>
                      <span>{hasVideoForDemo ? 'Video ativo' : 'Sem video'}</span>
                    </div>
                    {activeDemoOption && (
                      <p className="demo-query">
                        Video configurado para este exercicio.
                        {activeDemoOption.licenseLabel ? ` Fonte: ${activeDemoOption.licenseLabel}.` : ''}
                      </p>
                    )}
                    {renderDemoMedia(
                      activeDemoOption,
                      `Demonstracao ${getExerciseDisplayName(demoExercise.name)}`,
                    )}
                    {activeDemoOption?.source === 'custom' && activeDemoOption.rawUrl && (
                      <a className="demo-link" href={activeDemoOption.rawUrl} target="_blank" rel="noreferrer">
                        Abrir arquivo original
                      </a>
                    )}

                    <details className="demo-manage-box">
                      <summary>Configurar video deste exercicio</summary>
                      <form className="video-attach-form" onSubmit={handleSaveVideoAttachment}>
                        <label className="field-label" htmlFor="attach-video-url">URL do video</label>
                        <input
                          id="attach-video-url"
                          className="field-input"
                          value={videoAttachmentForm.rawUrl}
                          onChange={(event) =>
                            setVideoAttachmentForm((current) => ({ ...current, rawUrl: event.target.value }))
                          }
                          placeholder="Cole URL do video (YouTube, MP4, GIF...)"
                        />
                        <div className="video-attach-grid">
                          <input
                            className="field-input"
                            value={videoAttachmentForm.licenseLabel}
                            onChange={(event) =>
                              setVideoAttachmentForm((current) => ({ ...current, licenseLabel: event.target.value }))
                            }
                            placeholder="Fonte/licenca (opcional)"
                          />
                          <input
                            className="field-input"
                            value={videoAttachmentForm.notes}
                            onChange={(event) =>
                              setVideoAttachmentForm((current) => ({ ...current, notes: event.target.value }))
                            }
                            placeholder="Observacao interna (opcional)"
                          />
                        </div>
                        <div className="video-attach-actions">
                          <button type="submit" className="btn-primary">Salvar video</button>
                          <button type="button" className="btn-secondary" onClick={handleRemoveVideoAttachment}>
                            Remover
                          </button>
                        </div>
                        <p className="demo-query">
                          {hasVideoForDemo
                            ? 'Este video ja esta ativo para o aluno.'
                            : 'Sem video configurado para este exercicio.'}
                        </p>
                        {hasSupabaseCredentials && (
                          <p className="demo-query">
                            {exerciseVideoCloudStatus === 'ready' && 'Sincronizacao de videos: ativa na nuvem.'}
                            {exerciseVideoCloudStatus === 'missing_table' &&
                              'Sincronizacao de videos: pendente (falta tabela exercise_videos no Supabase).'}
                            {exerciseVideoCloudStatus === 'error' &&
                              'Sincronizacao de videos: erro temporario, mantendo local.'}
                            {exerciseVideoCloudStatus === 'idle' &&
                              'Sincronizacao de videos: aguardando login.'}
                          </p>
                        )}
                      </form>

                      <div className="video-batch-box">
                        <div className="video-attach-actions">
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => void handleImportVideosFromExerciseDb()}
                            disabled={rapidApiImporting}
                          >
                            {rapidApiImporting ? 'Sincronizando videos...' : 'Importar videos via RapidAPI'}
                          </button>
                        </div>
                        <p className="demo-query">
                          Busca midias automaticamente no ExerciseDB para preencher os videos da biblioteca.
                        </p>
                        <p className="demo-query">
                          Requer VITE_EXERCISEDB_API_KEY no .env.
                        </p>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="workout-builder focused">
                <div className="draft-column">
                  <div className="draft-head">
                    <div>
                      <h4>Ficha de {selectedStudent.name}</h4>
                      <p>Protocolo limpo: adicione pela biblioteca e ajuste cada exercício conforme o planejamento.</p>
                    </div>
                    <div className="draft-head-actions">
                      {filteredDraft.length > 0 && (
                        <>
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => {
                              setCollapsedDraftExerciseIds(filteredDraft.map((exercise) => exercise.id))
                              setEditingDraftExerciseId(null)
                            }}
                          >
                            Recolher todos
                          </button>
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => setCollapsedDraftExerciseIds([])}
                          >
                            Expandir todos
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => setShowManualCreateForm((current) => !current)}
                      >
                        {showManualCreateForm ? 'Fechar manual' : 'Criar manual'}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setWorkoutBuilderStep('biblioteca')}
                      >
                        Voltar para biblioteca
                      </button>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => {
                          void handleClearStudentWorkout()
                        }}
                      >
                        Limpar ficha inteira
                      </button>
                      <span className="chip">{workoutDraft.length} exercicios</span>
                    </div>
                  </div>

                  <div className="draft-list">
                    {showManualCreateForm && (
                      <form className="phase-card" onSubmit={handleSubmitManualCreate}>
                        <p className="phase-title">Novo exercicio manual</p>
                        <div className="phase-grid">
                          <div>
                            <label className="field-label" htmlFor="manual-exercise-name">Nome do exercicio</label>
                            <input
                              id="manual-exercise-name"
                              className="field-input"
                              value={manualExerciseForm.name}
                              onChange={(event) =>
                                setManualExerciseForm((current) => ({ ...current, name: event.target.value }))
                              }
                              placeholder="Ex: Remada unilateral na polia"
                            />
                          </div>
                          <div>
                            <label className="field-label" htmlFor="manual-exercise-group">Grupo muscular</label>
                            <input
                              id="manual-exercise-group"
                              className="field-input"
                              value={manualExerciseForm.muscleGroup}
                              onChange={(event) =>
                                setManualExerciseForm((current) => ({ ...current, muscleGroup: event.target.value }))
                              }
                            />
                          </div>
                          <div>
                            <label className="field-label" htmlFor="manual-exercise-category">Categoria</label>
                            <input
                              id="manual-exercise-category"
                              className="field-input"
                              value={manualExerciseForm.category}
                              onChange={(event) =>
                                setManualExerciseForm((current) => ({ ...current, category: event.target.value }))
                              }
                            />
                          </div>
                          <div>
                            <label className="field-label" htmlFor="manual-exercise-equipment">Equipamento</label>
                            <input
                              id="manual-exercise-equipment"
                              className="field-input"
                              value={manualExerciseForm.equipment}
                              onChange={(event) =>
                                setManualExerciseForm((current) => ({ ...current, equipment: event.target.value }))
                              }
                            />
                          </div>
                        </div>
                        <p className="demo-query">
                          Vai entrar no Treino {activeDraftRoutine} • Dia {activeDraftDay || 'Todos os dias'}.
                        </p>
                        <div className="video-attach-actions manual-create-actions">
                          <button type="submit" className="btn-primary">Adicionar no protocolo</button>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setShowManualCreateForm(false)}
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    )}

                    {workoutDraft.length === 0 && (
                      <p className="empty-line">
                        Nenhum exercicio no treino. Volte para Biblioteca e adicione alguns.
                      </p>
                    )}
                    {workoutDraft.length > 0 && filteredDraft.length === 0 && (
                      <p className="empty-line">
                        Nenhum exercício encontrado no filtro atual de treino/dia.
                      </p>
                    )}

                    {filteredDraft.map((exercise, index) => (
                      <article key={exercise.id} className="draft-item">
                        <div className="draft-item-head">
                          <div>
                            <strong>{index + 1}. {getExerciseDisplayName(exercise.name)}</strong>
                            <span>
                              Treino {normalizeWorkoutRoutine(exercise.routine)} • Dia {normalizeWorkoutDay(exercise.day) || 'Todos'} • {exercise.muscleGroup} - {exercise.equipment}
                            </span>
                          </div>
                          <div className="draft-item-head-actions">
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => {
                                setCollapsedDraftExerciseIds((current) =>
                                  isExerciseCollapsed(exercise.id)
                                    ? current.filter((id) => id !== exercise.id)
                                    : [...current, exercise.id],
                                )
                                if (!isExerciseCollapsed(exercise.id) && editingDraftExerciseId === exercise.id) {
                                  setEditingDraftExerciseId(null)
                                }
                              }}
                              aria-expanded={!isExerciseCollapsed(exercise.id)}
                            >
                              {isExerciseCollapsed(exercise.id) ? 'Expandir' : 'Recolher'}
                            </button>
                            <button
                              type="button"
                              className="btn-ghost"
                              onClick={() => handleRemoveDraftExercise(exercise.id)}
                            >
                              Remover
                            </button>
                          </div>
                        </div>

                        {isExerciseCollapsed(exercise.id) && (
                          <p className="draft-collapsed-hint">
                            Exercício recolhido. Toque em <strong>Expandir</strong> para editar protocolo e séries.
                          </p>
                        )}

                        <div className="draft-item-summary" hidden={isExerciseCollapsed(exercise.id)}>
                          <span>Warm-up: {exercise.warmup}</span>
                          <span>Feeder: {exercise.feederSets}x{exercise.feederReps} @ RPE {exercise.feederRpe}</span>
                          <span>Work: {exercise.workSets}x{exercise.workReps} @ RPE {exercise.workRpe}</span>
                          <span>Descanso: {exercise.rest}</span>
                          <span>{exercise.useClusterSet ? `Cluster ativo (${exercise.clusterBlocks} blocos, ${exercise.clusterReps}, ${exercise.clusterRest})` : 'Cluster desativado'}</span>
                          <span>{exercise.useMyoReps ? `Myo ativo (${exercise.myoRest})` : 'Myo desativado'}</span>
                        </div>

                        <div className="draft-item-actions" hidden={isExerciseCollapsed(exercise.id)}>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() =>
                              setEditingDraftExerciseId((current) => (current === exercise.id ? null : exercise.id))
                            }
                          >
                            {editingDraftExerciseId === exercise.id ? 'Fechar edicao' : 'Editar protocolo'}
                          </button>
                        </div>

                        {!isExerciseCollapsed(exercise.id) && editingDraftExerciseId === exercise.id && (
                          <>
                            <div className="draft-grid">
                              <div>
                                <label className="field-label" htmlFor={`protocol-mode-${exercise.id}`}>Modelo do protocolo</label>
                                <select
                                  id={`protocol-mode-${exercise.id}`}
                                  className="field-input"
                                  value={getProtocolMode(exercise)}
                                  onChange={(event) =>
                                    applyProtocolMode(exercise.id, event.target.value as ProtocolMode)
                                  }
                                >
                                  <option value="padrao">Padrao</option>
                                  <option value="cluster">Cluster set</option>
                                  <option value="myo">Myo-reps</option>
                                  <option value="cluster_myo">Cluster + Myo</option>
                                </select>
                              </div>
                              <div>
                                <label className="field-label" htmlFor={`routine-${exercise.id}`}>Treino</label>
                                <select
                                  id={`routine-${exercise.id}`}
                                  className="field-input"
                                  value={normalizeWorkoutRoutine(exercise.routine)}
                                  onChange={(event) =>
                                    handleUpdateDraftExercise(exercise.id, 'routine', event.target.value)
                                  }
                                >
                                  {studentRoutineOptions.map((routine) => (
                                    <option key={`draft-routine-${exercise.id}-${routine}`} value={routine}>
                                      Treino {routine}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="field-label" htmlFor={`day-${exercise.id}`}>Dia</label>
                                <select
                                  id={`day-${exercise.id}`}
                                  className="field-input"
                                  value={normalizeWorkoutDay(exercise.day)}
                                  onChange={(event) =>
                                    handleUpdateDraftExercise(exercise.id, 'day', event.target.value)
                                  }
                                >
                                  <option value="">Todos os dias</option>
                                  {studentAvailableDays.map((day) => (
                                    <option key={`draft-day-${exercise.id}-${day}`} value={day}>{day}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="field-label" htmlFor={`warmup-${exercise.id}`}>Warm-up</label>
                                <input
                                  id={`warmup-${exercise.id}`}
                                  className="field-input"
                                  value={exercise.warmup}
                                  onChange={(event) =>
                                    handleUpdateDraftExercise(exercise.id, 'warmup', event.target.value)
                                  }
                                  placeholder="Ex: 50%x15, 65%x10, 75%x5"
                                />
                              </div>
                              <div>
                                <label className="field-label" htmlFor={`rest-${exercise.id}`}>Descanso principal</label>
                                <input
                                  id={`rest-${exercise.id}`}
                                  className="field-input"
                                  value={exercise.rest}
                                  onChange={(event) =>
                                    handleUpdateDraftExercise(exercise.id, 'rest', event.target.value)
                                  }
                                  placeholder="Ex: 90s"
                                />
                              </div>
                            </div>

                            <div className="phase-card">
                              <p className="phase-title">Feeder sets</p>
                              <div className="phase-grid">
                                <div>
                                  <label className="field-label" htmlFor={`feeder-sets-${exercise.id}`}>Sets</label>
                                  <input id={`feeder-sets-${exercise.id}`} className="field-input" value={exercise.feederSets} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'feederSets', event.target.value)} />
                                </div>
                                <div>
                                  <label className="field-label" htmlFor={`feeder-reps-${exercise.id}`}>Reps</label>
                                  <input id={`feeder-reps-${exercise.id}`} className="field-input" value={exercise.feederReps} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'feederReps', event.target.value)} placeholder="Ex: 5-6" />
                                </div>
                                <div>
                                  <label className="field-label" htmlFor={`feeder-rpe-${exercise.id}`}>RPE</label>
                                  <input id={`feeder-rpe-${exercise.id}`} className="field-input" value={exercise.feederRpe} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'feederRpe', event.target.value)} placeholder="Ex: 6-7" />
                                </div>
                              </div>
                            </div>

                            <div className="phase-card">
                              <p className="phase-title">Work sets</p>
                              <div className="phase-grid">
                                <div>
                                  <label className="field-label" htmlFor={`work-sets-${exercise.id}`}>Sets</label>
                                  <input id={`work-sets-${exercise.id}`} className="field-input" value={exercise.workSets} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'workSets', event.target.value)} />
                                </div>
                                <div>
                                  <label className="field-label" htmlFor={`work-reps-${exercise.id}`}>Reps</label>
                                  <input id={`work-reps-${exercise.id}`} className="field-input" value={exercise.workReps} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'workReps', event.target.value)} placeholder="Ex: 6-8" />
                                </div>
                                <div>
                                  <label className="field-label" htmlFor={`work-rpe-${exercise.id}`}>RPE</label>
                                  <input id={`work-rpe-${exercise.id}`} className="field-input" value={exercise.workRpe} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'workRpe', event.target.value)} placeholder="Ex: 8-9" />
                                </div>
                              </div>
                            </div>

                            <div className="myo-toggle-row">
                              <label className="myo-toggle" htmlFor={`cluster-toggle-${exercise.id}`}>
                                <input
                                  id={`cluster-toggle-${exercise.id}`}
                                  type="checkbox"
                                  checked={exercise.useClusterSet}
                                  onChange={(event) =>
                                    handleUpdateDraftExercise(exercise.id, 'useClusterSet', event.target.checked)
                                  }
                                />
                                <span>Ativar Cluster Set</span>
                              </label>
                            </div>

                            {exercise.useClusterSet && (
                              <div className="phase-grid">
                                <div>
                                  <label className="field-label" htmlFor={`cluster-blocks-${exercise.id}`}>Blocos</label>
                                  <input id={`cluster-blocks-${exercise.id}`} className="field-input" value={exercise.clusterBlocks} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'clusterBlocks', event.target.value)} placeholder="Ex: 3" />
                                </div>
                                <div>
                                  <label className="field-label" htmlFor={`cluster-reps-${exercise.id}`}>Reps por bloco</label>
                                  <input id={`cluster-reps-${exercise.id}`} className="field-input" value={exercise.clusterReps} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'clusterReps', event.target.value)} placeholder="Ex: 2-3" />
                                </div>
                                <div>
                                  <label className="field-label" htmlFor={`cluster-rest-${exercise.id}`}>Descanso intra</label>
                                  <input id={`cluster-rest-${exercise.id}`} className="field-input" value={exercise.clusterRest} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'clusterRest', event.target.value)} placeholder="Ex: 20s" />
                                </div>
                              </div>
                            )}

                            <div className="myo-toggle-row">
                              <label className="myo-toggle" htmlFor={`myo-toggle-${exercise.id}`}>
                                <input
                                  id={`myo-toggle-${exercise.id}`}
                                  type="checkbox"
                                  checked={exercise.useMyoReps}
                                  onChange={(event) =>
                                    handleUpdateDraftExercise(exercise.id, 'useMyoReps', event.target.checked)
                                  }
                                />
                                <span>Ativar Myo-reps</span>
                              </label>
                            </div>

                            {exercise.useMyoReps && (
                              <div className="phase-grid">
                                <div>
                                  <label className="field-label" htmlFor={`myo-sets-${exercise.id}`}>Mini sets</label>
                                  <input id={`myo-sets-${exercise.id}`} className="field-input" value={exercise.myoMiniSets} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'myoMiniSets', event.target.value)} />
                                </div>
                                <div>
                                  <label className="field-label" htmlFor={`myo-reps-${exercise.id}`}>Reps mini</label>
                                  <input id={`myo-reps-${exercise.id}`} className="field-input" value={exercise.myoMiniReps} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'myoMiniReps', event.target.value)} placeholder="Ex: 3-5" />
                                </div>
                                <div>
                                  <label className="field-label" htmlFor={`myo-rest-${exercise.id}`}>Descanso mini</label>
                                  <input id={`myo-rest-${exercise.id}`} className="field-input" value={exercise.myoRest} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'myoRest', event.target.value)} placeholder="Ex: 5s" />
                                </div>
                              </div>
                            )}

                            <label className="field-label" htmlFor={`note-${exercise.id}`}>Observacao tecnica</label>
                            <input
                              id={`note-${exercise.id}`}
                              className="field-input"
                              value={exercise.note}
                              onChange={(event) =>
                                handleUpdateDraftExercise(exercise.id, 'note', event.target.value)
                              }
                              placeholder="Ajustes de execucao para esse aluno"
                            />
                          </>
                        )}
                      </article>
                    ))}
                  </div>

                  <button type="button" className="btn-primary" onClick={handleSaveWorkoutDraft}>
                    Finalizar treino
                  </button>
                  {syncMessage && <p className="status-line">{syncMessage}</p>}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </section>
  )
}
