import type { Dispatch, FormEvent, SetStateAction } from 'react'
import { normalizeWorkoutDay, normalizeWorkoutRoutine } from '../../../utils/workoutProtocol'
import type { WorkoutDraftItem, WorkoutDraftEditableField } from '../../../types/workout'
import type { ManualExerciseFormState } from '../../../context/appContextStore'
import type { ProtocolMode } from '../hooks/useWorkoutBuilderState'

export type WorkoutBuilderProtocolProps = {
  selectedStudentName: string
  workoutDraft: WorkoutDraftItem[]
  filteredDraft: WorkoutDraftItem[]
  editingDraftExerciseId: string | null
  setEditingDraftExerciseId: Dispatch<SetStateAction<string | null>>
  setWorkoutBuilderStep: Dispatch<SetStateAction<'biblioteca' | 'protocolo'>>
  handleRemoveDraftExercise: (draftId: string) => void
  handleUpdateDraftExercise: <K extends WorkoutDraftEditableField>(draftId: string, field: K, value: WorkoutDraftItem[K]) => void
  handleClearStudentWorkout: () => Promise<void>
  showManualCreateForm: boolean
  setShowManualCreateForm: (value: boolean | ((current: boolean) => boolean)) => void
  handleSubmitManualCreate: (event: FormEvent<HTMLFormElement>) => void
  manualExerciseForm: ManualExerciseFormState
  setManualExerciseForm: Dispatch<SetStateAction<ManualExerciseFormState>>
  activeDraftDay: string
  activeDraftRoutine: string
  activeDraftRoutineLabel: string
  studentAvailableDays: string[]
  studentRoutineOptions: string[]
  collapsedDraftExerciseIds: string[]
  setCollapsedDraftExerciseIds: (value: string[] | ((current: string[]) => string[])) => void
  isExerciseCollapsed: (exerciseId: string) => boolean
  getProtocolMode: (exercise: WorkoutDraftItem) => ProtocolMode
  applyProtocolMode: (exerciseId: string, mode: ProtocolMode) => void
  finalizeLoading: boolean
  runFinalizeWorkout: (advanceToNextDay: boolean) => Promise<void>
  syncMessage: string
  getExerciseDisplayName: (exerciseName: string) => string
  getRoutineDisplayName: (routine: string) => string
}

export function WorkoutBuilderProtocol(props: WorkoutBuilderProtocolProps) {
  const {
    selectedStudentName, workoutDraft, filteredDraft,
    editingDraftExerciseId, setEditingDraftExerciseId, setWorkoutBuilderStep,
    handleRemoveDraftExercise, handleUpdateDraftExercise, handleClearStudentWorkout,
    showManualCreateForm, setShowManualCreateForm, handleSubmitManualCreate,
    manualExerciseForm, setManualExerciseForm,
    activeDraftDay, activeDraftRoutine, activeDraftRoutineLabel, studentAvailableDays, studentRoutineOptions,
    setCollapsedDraftExerciseIds, isExerciseCollapsed,
    getProtocolMode, applyProtocolMode,
    finalizeLoading, runFinalizeWorkout, syncMessage, getExerciseDisplayName, getRoutineDisplayName,
  } = props

  return (
    <>
      <div className="workout-builder focused">
        <div className="draft-column">
          <div className="draft-head">
            <div>
              <h4>Ficha de {selectedStudentName}</h4>
              <p>Protocolo limpo: adicione pela biblioteca e ajuste cada exercício conforme o planejamento.</p>
            </div>
            <div className="draft-head-actions">
              {filteredDraft.length > 0 && (
                <>
                  <button type="button" className="btn-ghost" onClick={() => { setCollapsedDraftExerciseIds(filteredDraft.map((e) => e.id)); setEditingDraftExerciseId(null) }}>Recolher todos</button>
                  <button type="button" className="btn-ghost" onClick={() => setCollapsedDraftExerciseIds([])}>Expandir todos</button>
                </>
              )}
              <button type="button" className="btn-ghost" onClick={() => setShowManualCreateForm((current) => !current)}>{showManualCreateForm ? 'Fechar manual' : 'Criar manual'}</button>
              <button type="button" className="btn-secondary" onClick={() => setWorkoutBuilderStep('biblioteca')}>Voltar para biblioteca</button>
              <button type="button" className="btn-ghost" onClick={() => { void handleClearStudentWorkout() }}>Limpar ficha inteira</button>
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
                    <input id="manual-exercise-name" className="field-input" value={manualExerciseForm.name} onChange={(event) => setManualExerciseForm((c) => ({ ...c, name: event.target.value }))} placeholder="Ex: Remada unilateral na polia" />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="manual-exercise-group">Grupo muscular</label>
                    <input id="manual-exercise-group" className="field-input" value={manualExerciseForm.muscleGroup} onChange={(event) => setManualExerciseForm((c) => ({ ...c, muscleGroup: event.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="manual-exercise-category">Categoria</label>
                    <input id="manual-exercise-category" className="field-input" value={manualExerciseForm.category} onChange={(event) => setManualExerciseForm((c) => ({ ...c, category: event.target.value }))} />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="manual-exercise-equipment">Equipamento</label>
                    <input id="manual-exercise-equipment" className="field-input" value={manualExerciseForm.equipment} onChange={(event) => setManualExerciseForm((c) => ({ ...c, equipment: event.target.value }))} />
                  </div>
                </div>
                <p className="demo-query">
                  Vai entrar em {activeDraftRoutineLabel ? `${getRoutineDisplayName(activeDraftRoutine)}` : `Treino ${activeDraftRoutine}`} • Dia {activeDraftDay || 'Todos os dias'}.
                </p>
                <div className="video-attach-actions manual-create-actions">
                  <button type="submit" className="btn-primary">Adicionar no protocolo</button>
                  <button type="button" className="btn-secondary" onClick={() => setShowManualCreateForm(false)}>Cancelar</button>
                </div>
              </form>
            )}

            {workoutDraft.length === 0 && (<p className="empty-line">Nenhum exercicio no treino. Volte para Biblioteca e adicione alguns.</p>)}
            {workoutDraft.length > 0 && filteredDraft.length === 0 && (<p className="empty-line">Nenhum exercício encontrado no filtro atual de treino/dia.</p>)}

            {filteredDraft.map((exercise, index) => (
              <article key={exercise.id} className="draft-item">
                <div className="draft-item-head">
                  <div>
                    <strong>{index + 1}. {getExerciseDisplayName(exercise.name)}</strong>
                    <span>{getRoutineDisplayName(normalizeWorkoutRoutine(exercise.routine))} • Dia {normalizeWorkoutDay(exercise.day) || 'Todos'} • {exercise.muscleGroup} - {exercise.equipment}</span>
                  </div>
                  <div className="draft-item-head-actions">
                    <button type="button" className="btn-secondary" onClick={() => { setCollapsedDraftExerciseIds((current) => isExerciseCollapsed(exercise.id) ? current.filter((id) => id !== exercise.id) : [...current, exercise.id]); if (!isExerciseCollapsed(exercise.id) && editingDraftExerciseId === exercise.id) { setEditingDraftExerciseId(null) } }} aria-expanded={!isExerciseCollapsed(exercise.id)}>{isExerciseCollapsed(exercise.id) ? 'Expandir' : 'Recolher'}</button>
                    <button type="button" className="btn-ghost" onClick={() => handleRemoveDraftExercise(exercise.id)}>Remover</button>
                  </div>
                </div>

                {isExerciseCollapsed(exercise.id) && (<p className="draft-collapsed-hint">Exercício recolhido. Toque em <strong>Expandir</strong> para editar protocolo e séries.</p>)}

                <div className="draft-item-summary" hidden={isExerciseCollapsed(exercise.id)}>
                  <span>Warm-up: {exercise.warmup}</span>
                  <span>Feeder: {exercise.feederSets}x{exercise.feederReps} @ RPE {exercise.feederRpe}</span>
                  <span>Work: {exercise.workSets}x{exercise.workReps} @ RPE {exercise.workRpe}</span>
                  <span>Descanso: {exercise.rest}</span>
                  <span>{exercise.useClusterSet ? `Cluster ativo (${exercise.clusterBlocks} blocos, ${exercise.clusterReps}, ${exercise.clusterRest})` : 'Cluster desativado'}</span>
                  <span>{exercise.useMyoReps ? `Myo ativo (${exercise.myoRest})` : 'Myo desativado'}</span>
                </div>

                <div className="draft-item-actions" hidden={isExerciseCollapsed(exercise.id)}>
                  <button type="button" className="btn-secondary" onClick={() => setEditingDraftExerciseId((current) => (current === exercise.id ? null : exercise.id))}>{editingDraftExerciseId === exercise.id ? 'Fechar edicao' : 'Editar protocolo'}</button>
                </div>

                {!isExerciseCollapsed(exercise.id) && editingDraftExerciseId === exercise.id && (
                  <>
                    <div className="draft-grid">
                      <div>
                        <label className="field-label" htmlFor={`protocol-mode-${exercise.id}`}>Modelo do protocolo</label>
                        <select id={`protocol-mode-${exercise.id}`} className="field-input" value={getProtocolMode(exercise)} onChange={(event) => applyProtocolMode(exercise.id, event.target.value as ProtocolMode)}>
                          <option value="padrao">Padrao</option><option value="cluster">Cluster set</option><option value="myo">Myo-reps</option><option value="cluster_myo">Cluster + Myo</option>
                        </select>
                      </div>
                      <div>
                        <label className="field-label" htmlFor={`routine-${exercise.id}`}>Treino</label>
                        <select id={`routine-${exercise.id}`} className="field-input" value={normalizeWorkoutRoutine(exercise.routine)} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'routine', event.target.value)}>
                          {studentRoutineOptions.map((routine) => (<option key={`draft-routine-${exercise.id}-${routine}`} value={routine}>{getRoutineDisplayName(routine)}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="field-label" htmlFor={`day-${exercise.id}`}>Dia</label>
                        <select id={`day-${exercise.id}`} className="field-input" value={normalizeWorkoutDay(exercise.day)} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'day', event.target.value)}>
                          <option value="">Todos os dias</option>
                          {studentAvailableDays.map((day) => (<option key={`draft-day-${exercise.id}-${day}`} value={day}>{day}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="field-label" htmlFor={`warmup-${exercise.id}`}>Warm-up</label>
                        <input id={`warmup-${exercise.id}`} className="field-input" value={exercise.warmup} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'warmup', event.target.value)} placeholder="Ex: 50%x15, 65%x10, 75%x5" />
                      </div>
                      <div>
                        <label className="field-label" htmlFor={`rest-${exercise.id}`}>Descanso principal</label>
                        <input id={`rest-${exercise.id}`} className="field-input" value={exercise.rest} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'rest', event.target.value)} placeholder="Ex: 90s" />
                      </div>
                    </div>
                    <div className="phase-card">
                      <p className="phase-title">Feeder sets</p>
                      <div className="phase-grid">
                        <div><label className="field-label" htmlFor={`feeder-sets-${exercise.id}`}>Sets</label><input id={`feeder-sets-${exercise.id}`} className="field-input" value={exercise.feederSets} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'feederSets', event.target.value)} /></div>
                        <div><label className="field-label" htmlFor={`feeder-reps-${exercise.id}`}>Reps</label><input id={`feeder-reps-${exercise.id}`} className="field-input" value={exercise.feederReps} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'feederReps', event.target.value)} placeholder="Ex: 5-6" /></div>
                        <div><label className="field-label" htmlFor={`feeder-rpe-${exercise.id}`}>RPE</label><input id={`feeder-rpe-${exercise.id}`} className="field-input" value={exercise.feederRpe} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'feederRpe', event.target.value)} placeholder="Ex: 6-7" /></div>
                      </div>
                    </div>
                    <div className="phase-card">
                      <p className="phase-title">Work sets</p>
                      <div className="phase-grid">
                        <div><label className="field-label" htmlFor={`work-sets-${exercise.id}`}>Sets</label><input id={`work-sets-${exercise.id}`} className="field-input" value={exercise.workSets} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'workSets', event.target.value)} /></div>
                        <div><label className="field-label" htmlFor={`work-reps-${exercise.id}`}>Reps</label><input id={`work-reps-${exercise.id}`} className="field-input" value={exercise.workReps} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'workReps', event.target.value)} placeholder="Ex: 6-8" /></div>
                        <div><label className="field-label" htmlFor={`work-rpe-${exercise.id}`}>RPE</label><input id={`work-rpe-${exercise.id}`} className="field-input" value={exercise.workRpe} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'workRpe', event.target.value)} placeholder="Ex: 8-9" /></div>
                      </div>
                    </div>
                    <div className="myo-toggle-row"><label className="myo-toggle" htmlFor={`cluster-toggle-${exercise.id}`}><input id={`cluster-toggle-${exercise.id}`} type="checkbox" checked={exercise.useClusterSet} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'useClusterSet', event.target.checked)} /><span>Ativar Cluster Set</span></label></div>
                    {exercise.useClusterSet && (
                      <div className="phase-grid">
                        <div><label className="field-label" htmlFor={`cluster-blocks-${exercise.id}`}>Blocos</label><input id={`cluster-blocks-${exercise.id}`} className="field-input" value={exercise.clusterBlocks} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'clusterBlocks', event.target.value)} placeholder="Ex: 3" /></div>
                        <div><label className="field-label" htmlFor={`cluster-reps-${exercise.id}`}>Reps por bloco</label><input id={`cluster-reps-${exercise.id}`} className="field-input" value={exercise.clusterReps} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'clusterReps', event.target.value)} placeholder="Ex: 2-3" /></div>
                        <div><label className="field-label" htmlFor={`cluster-rest-${exercise.id}`}>Descanso intra</label><input id={`cluster-rest-${exercise.id}`} className="field-input" value={exercise.clusterRest} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'clusterRest', event.target.value)} placeholder="Ex: 20s" /></div>
                      </div>
                    )}
                    <div className="myo-toggle-row"><label className="myo-toggle" htmlFor={`myo-toggle-${exercise.id}`}><input id={`myo-toggle-${exercise.id}`} type="checkbox" checked={exercise.useMyoReps} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'useMyoReps', event.target.checked)} /><span>Ativar Myo-reps</span></label></div>
                    {exercise.useMyoReps && (
                      <div className="phase-grid">
                        <div><label className="field-label" htmlFor={`myo-sets-${exercise.id}`}>Mini sets</label><input id={`myo-sets-${exercise.id}`} className="field-input" value={exercise.myoMiniSets} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'myoMiniSets', event.target.value)} /></div>
                        <div><label className="field-label" htmlFor={`myo-reps-${exercise.id}`}>Reps mini</label><input id={`myo-reps-${exercise.id}`} className="field-input" value={exercise.myoMiniReps} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'myoMiniReps', event.target.value)} placeholder="Ex: 3-5" /></div>
                        <div><label className="field-label" htmlFor={`myo-rest-${exercise.id}`}>Descanso mini</label><input id={`myo-rest-${exercise.id}`} className="field-input" value={exercise.myoRest} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'myoRest', event.target.value)} placeholder="Ex: 5s" /></div>
                      </div>
                    )}
                    <label className="field-label" htmlFor={`note-${exercise.id}`}>Observacao tecnica</label>
                    <input id={`note-${exercise.id}`} className="field-input" value={exercise.note} onChange={(event) => handleUpdateDraftExercise(exercise.id, 'note', event.target.value)} placeholder="Ajustes de execucao para esse aluno" />
                  </>
                )}
              </article>
            ))}
          </div>

          <div className="video-attach-actions">
            <button type="button" className="btn-primary" onClick={() => { void runFinalizeWorkout(false) }} disabled={finalizeLoading}>{finalizeLoading ? 'Salvando...' : 'Finalizar treino'}</button>
            <button type="button" className="btn-secondary" onClick={() => { void runFinalizeWorkout(true) }} disabled={finalizeLoading}>{finalizeLoading ? 'Aguarde...' : 'Finalizar e proximo dia'}</button>
          </div>
          {syncMessage && <p className="status-line">{syncMessage}</p>}
        </div>
      </div>
    </>
  )
}
