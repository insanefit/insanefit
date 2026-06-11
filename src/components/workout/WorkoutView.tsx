import { useMetaContext, useTrainerContext, useWorkoutContext } from '../../context/appContextStore'
import { getExerciseVideoAttachment } from '../../utils/exerciseUtils'
import { useWorkoutBuilderState } from './hooks/useWorkoutBuilderState'
import { WorkoutBuilderLibrary } from './tabs/WorkoutBuilderLibrary'
import { WorkoutBuilderProtocol } from './tabs/WorkoutBuilderProtocol'

export function WorkoutView() {
  const {
    trainerData, students, sessions, selectedStudent, selectedStudentId, setSelectedStudentId,
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

  const builderState = useWorkoutBuilderState({
    selectedStudent, sessions, weekDays, workoutDraft, setWorkoutDraft,
    filteredExercises, exerciseVideoMap, setSyncMessage, setWorkoutBuilderStep,
    setVideoAttachmentForm, handleOpenExerciseDemo, handleSaveWorkoutDraft,
    handleAddManualExercise, manualExerciseForm, editingDraftExerciseId, setEditingDraftExerciseId,
  })

  const {
    libraryTab, setLibraryTab, libraryPage, setLibraryPage,
    showAdvancedLibraryTools, setShowAdvancedLibraryTools,
    showManualCreateForm, setShowManualCreateForm,
    showPlanningTools, setShowPlanningTools,
    collapsedDraftExerciseIds, setCollapsedDraftExerciseIds,
    finalizeLoading,
    activeDraftDay, setActiveDraftDayChoice,
    draftDayFilter, setDraftDayFilterChoice,
    activeDraftRoutine, setActiveDraftRoutineChoice,
    draftRoutineFilter, setDraftRoutineFilterChoice,
    duplicateSourceRoutine, setDuplicateSourceRoutine,
    duplicateTargetRoutine, setDuplicateTargetRoutine,
    studentAvailableDays, studentRoutineOptions,
    draftNameKeys, videoEnabledCount, draftMatchCount, filteredDraft,
    totalLibraryPages, safeLibraryPage, visibleLibraryExercises, visiblePages,
    handleDuplicateRoutine, handleClearLibraryFilters, handleOpenManualCreate,
    runFinalizeWorkout, handleSubmitManualCreate, isExerciseCollapsed,
    handleEditExerciseVideo, getProtocolMode, applyProtocolMode,
    extractYoutubeVideoId, buildYoutubeThumbUrl,
  } = builderState

  const showingWorkoutLibrary = workoutBuilderStep === 'biblioteca'
  const hasVideoForDemo =
    demoExercise ? Boolean(getExerciseVideoAttachment(demoExercise.name, exerciseVideoMap)) : false

  const selectStudentForWorkout = (studentId: string) => {
    setSelectedStudentId(studentId)
    setEditingStudent(false)
    setWorkoutBuilderOpen(true)
    setWorkoutBuilderStep('biblioteca')
    setActiveDraftDayChoice('')
    setDraftDayFilterChoice('Todos')
    setActiveDraftRoutineChoice('A')
    setDraftRoutineFilterChoice('Todos')
    setDuplicateSourceRoutine('A')
    setDuplicateTargetRoutine('B')
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
        <div className="workout-student-pick workout-student-picker-panel">
          <div className="workout-student-picker-head">
            <div>
              <span className="field-label">Escolha o aluno</span>
              <strong>{selectedStudent ? selectedStudent.name : 'Nenhum aluno selecionado'}</strong>
            </div>
            {selectedStudent && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setWorkoutBuilderOpen(true)
                  setWorkoutBuilderStep('protocolo')
                }}
              >
                Revisar ficha
              </button>
            )}
          </div>

          <div className="workout-student-quick-strip" aria-label="Alunos para montar treino">
            {students.map((student) => {
              const exerciseCount = trainerData.workoutByStudent[student.id]?.length ?? 0
              return (
                <button
                  key={`workout-student-${student.id}`}
                  type="button"
                  className={student.id === selectedStudentId ? 'workout-student-chip active' : 'workout-student-chip'}
                  onClick={() => selectStudentForWorkout(student.id)}
                >
                  <strong>{student.name}</strong>
                  <span>{getStudentTrainingLevel(student)} • {getStudentWorkoutType(student)}</span>
                  <small>{exerciseCount} exercicios</small>
                </button>
              )
            })}
          </div>

          <label className="field-label" htmlFor="workout-student-pick">Trocar por lista</label>
          <select
            id="workout-student-pick"
            className="field-input"
            value={selectedStudentId}
            onChange={(event) => {
              selectStudentForWorkout(event.target.value)
            }}
          >
            <option value="" disabled>Selecione um aluno</option>
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
              onClick={() => {
                void runFinalizeWorkout(false)
              }}
              disabled={finalizeLoading}
            >
              {finalizeLoading ? 'Salvando...' : 'Finalizar treino'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                void runFinalizeWorkout(true)
              }}
              disabled={finalizeLoading}
            >
              {finalizeLoading ? 'Aguarde...' : 'Finalizar e proximo dia'}
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
            <WorkoutBuilderLibrary
              workoutDraft={workoutDraft} workoutBuilderMode={workoutBuilderMode} setWorkoutBuilderMode={setWorkoutBuilderMode}
              setWorkoutBuilderStep={setWorkoutBuilderStep} exerciseQuery={exerciseQuery} setExerciseQuery={setExerciseQuery}
              groupFilter={groupFilter} setGroupFilter={setGroupFilter} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
              equipmentFilter={equipmentFilter} setEquipmentFilter={setEquipmentFilter} difficultyFilter={difficultyFilter} setDifficultyFilter={setDifficultyFilter}
              sourceFilter={sourceFilter} setSourceFilter={setSourceFilter} filteredExercises={filteredExercises} quickAddExercises={quickAddExercises}
              categoryOptions={categoryOptions} equipmentOptions={equipmentOptions} sourceSummary={sourceSummary}
              demoExercise={demoExercise} activeDemoOption={activeDemoOption} videoAttachmentForm={videoAttachmentForm} setVideoAttachmentForm={setVideoAttachmentForm}
              rapidApiImporting={rapidApiImporting} exerciseVideoCloudStatus={exerciseVideoCloudStatus} exerciseVideoMap={exerciseVideoMap}
              handleSaveVideoAttachment={handleSaveVideoAttachment} handleRemoveVideoAttachment={handleRemoveVideoAttachment}
              handleImportVideosFromExerciseDb={handleImportVideosFromExerciseDb} handleOpenExerciseDemo={handleOpenExerciseDemo}
              handleAddExerciseToDraft={handleAddExerciseToDraft} handleQuickAddExercise={handleQuickAddExercise} handleApplyWorkoutTemplate={handleApplyWorkoutTemplate}
              quickAddExerciseName={quickAddExerciseName} setQuickAddExerciseName={setQuickAddExerciseName}
              libraryTab={libraryTab} setLibraryTab={setLibraryTab} libraryPage={libraryPage} setLibraryPage={setLibraryPage}
              showAdvancedLibraryTools={showAdvancedLibraryTools} setShowAdvancedLibraryTools={setShowAdvancedLibraryTools}
              activeDraftDay={activeDraftDay} activeDraftRoutine={activeDraftRoutine} draftNameKeys={draftNameKeys}
              videoEnabledCount={videoEnabledCount} draftMatchCount={draftMatchCount}
              totalLibraryPages={totalLibraryPages} safeLibraryPage={safeLibraryPage} visibleLibraryExercises={visibleLibraryExercises} visiblePages={visiblePages}
              handleClearLibraryFilters={handleClearLibraryFilters} handleOpenManualCreate={handleOpenManualCreate} handleEditExerciseVideo={handleEditExerciseVideo}
              extractYoutubeVideoId={extractYoutubeVideoId} buildYoutubeThumbUrl={buildYoutubeThumbUrl} hasVideoForDemo={hasVideoForDemo}
              muscleGroups={muscleGroups} mergedExerciseLibrary={mergedExerciseLibrary} workoutTemplates={workoutTemplates}
              hasSupabaseCredentials={hasSupabaseCredentials} getExerciseDisplayName={getExerciseDisplayName} renderDemoMedia={renderDemoMedia}
              libraryExercises={builderState.libraryExercises}
            />
          ) : (
            <WorkoutBuilderProtocol
              selectedStudentName={selectedStudent.name}
              workoutDraft={workoutDraft} filteredDraft={filteredDraft}
              editingDraftExerciseId={editingDraftExerciseId} setEditingDraftExerciseId={setEditingDraftExerciseId}
              setWorkoutBuilderStep={setWorkoutBuilderStep}
              handleRemoveDraftExercise={handleRemoveDraftExercise} handleUpdateDraftExercise={handleUpdateDraftExercise}
              handleClearStudentWorkout={handleClearStudentWorkout}
              showManualCreateForm={showManualCreateForm} setShowManualCreateForm={setShowManualCreateForm}
              handleSubmitManualCreate={handleSubmitManualCreate}
              manualExerciseForm={manualExerciseForm} setManualExerciseForm={setManualExerciseForm}
              activeDraftDay={activeDraftDay} activeDraftRoutine={activeDraftRoutine}
              studentAvailableDays={studentAvailableDays} studentRoutineOptions={studentRoutineOptions}
              collapsedDraftExerciseIds={collapsedDraftExerciseIds} setCollapsedDraftExerciseIds={setCollapsedDraftExerciseIds}
              isExerciseCollapsed={isExerciseCollapsed} getProtocolMode={getProtocolMode} applyProtocolMode={applyProtocolMode}
              finalizeLoading={finalizeLoading} runFinalizeWorkout={runFinalizeWorkout}
              syncMessage={syncMessage} getExerciseDisplayName={getExerciseDisplayName}
            />
          )}
        </>
      )}
    </section>
  )
}
