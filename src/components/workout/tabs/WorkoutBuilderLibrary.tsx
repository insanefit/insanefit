import type { Dispatch, FormEvent, ReactNode, SetStateAction } from 'react'
import type { LibraryExercise } from '../../../data/exerciseLibrary'
import type { ExerciseVideoAttachment, ExerciseVideoCloudStatus, DemoViewerOption } from '../../../types/video'
import type { WorkoutDraftItem } from '../../../types/workout'
import type { WorkoutTemplate } from '../../../constants/workoutTemplates'
import type { VideoAttachmentFormState } from '../../../context/appContextStore'
import { resolveExerciseThumbnail } from '../../../utils/exerciseUtils'

export type WorkoutBuilderLibraryProps = {
  workoutDraft: WorkoutDraftItem[]
  workoutBuilderMode: 'simplificado' | 'pro'
  setWorkoutBuilderMode: Dispatch<SetStateAction<'simplificado' | 'pro'>>
  setWorkoutBuilderStep: Dispatch<SetStateAction<'biblioteca' | 'protocolo'>>
  exerciseQuery: string
  setExerciseQuery: Dispatch<SetStateAction<string>>
  groupFilter: string
  setGroupFilter: Dispatch<SetStateAction<string>>
  categoryFilter: string
  setCategoryFilter: Dispatch<SetStateAction<string>>
  equipmentFilter: string
  setEquipmentFilter: Dispatch<SetStateAction<string>>
  difficultyFilter: 'Todos' | 'beginner' | 'intermediate' | 'advanced'
  setDifficultyFilter: Dispatch<SetStateAction<'Todos' | 'beginner' | 'intermediate' | 'advanced'>>
  sourceFilter: 'Todos' | 'core' | 'animatic' | 'dataset'
  setSourceFilter: Dispatch<SetStateAction<'Todos' | 'core' | 'animatic' | 'dataset'>>
  filteredExercises: LibraryExercise[]
  quickAddExercises: LibraryExercise[]
  categoryOptions: string[]
  equipmentOptions: string[]
  sourceSummary: { core: number; animatic: number; dataset?: number }
  demoExercise: LibraryExercise | null
  activeDemoOption: DemoViewerOption | undefined
  videoAttachmentForm: VideoAttachmentFormState
  setVideoAttachmentForm: Dispatch<SetStateAction<VideoAttachmentFormState>>
  rapidApiImporting: boolean
  exerciseVideoCloudStatus: ExerciseVideoCloudStatus
  exerciseVideoMap: Record<string, ExerciseVideoAttachment>
  handleSaveVideoAttachment: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleRemoveVideoAttachment: () => Promise<void>
  handleImportVideosFromExerciseDb: () => Promise<void>
  handleOpenExerciseDemo: (exercise: LibraryExercise) => void
  handleAddExerciseToDraft: (exercise: LibraryExercise, day?: string, routine?: string, routineLabel?: string) => void
  handleQuickAddExercise: (event: FormEvent<HTMLFormElement>, day?: string, routine?: string, routineLabel?: string) => void
  handleApplyWorkoutTemplate: (template: WorkoutTemplate, day?: string, routine?: string, routineLabel?: string) => void
  quickAddExerciseName: string
  setQuickAddExerciseName: Dispatch<SetStateAction<string>>
  // From builderState
  libraryTab: 'app' | 'withGif' | 'inDraft'
  setLibraryTab: (tab: 'app' | 'withGif' | 'inDraft') => void
  libraryPage: number
  setLibraryPage: (page: number | ((current: number) => number)) => void
  showAdvancedLibraryTools: boolean
  setShowAdvancedLibraryTools: (value: boolean | ((current: boolean) => boolean)) => void
  activeDraftDay: string
  activeDraftRoutine: string
  activeDraftRoutineLabel: string
  draftNameKeys: Set<string>
  videoEnabledCount: number
  draftMatchCount: number
  totalLibraryPages: number
  safeLibraryPage: number
  visibleLibraryExercises: LibraryExercise[]
  visiblePages: number[]
  handleClearLibraryFilters: () => void
  handleOpenManualCreate: () => void
  handleEditExerciseVideo: (exercise: LibraryExercise) => void
  extractYoutubeVideoId: (value: string) => string | null
  buildYoutubeThumbUrl: (videoId: string) => string
  hasVideoForDemo: boolean
  // From metaContext
  muscleGroups: readonly string[]
  mergedExerciseLibrary: LibraryExercise[]
  workoutTemplates: WorkoutTemplate[]
  hasSupabaseCredentials: boolean
  getExerciseDisplayName: (exerciseName: string) => string
  renderDemoMedia: (option: DemoViewerOption | undefined, title: string) => ReactNode
  libraryExercises: LibraryExercise[]
}

export function WorkoutBuilderLibrary(props: WorkoutBuilderLibraryProps) {
  const {
    workoutDraft, workoutBuilderMode, setWorkoutBuilderMode, setWorkoutBuilderStep,
    exerciseQuery, setExerciseQuery, groupFilter, setGroupFilter,
    categoryFilter, setCategoryFilter, equipmentFilter, setEquipmentFilter,
    difficultyFilter, setDifficultyFilter, sourceFilter, setSourceFilter,
    filteredExercises, quickAddExercises, categoryOptions, equipmentOptions, sourceSummary,
    demoExercise, activeDemoOption, videoAttachmentForm, setVideoAttachmentForm,
    exerciseVideoCloudStatus,
    handleSaveVideoAttachment, handleRemoveVideoAttachment,
    handleAddExerciseToDraft, handleQuickAddExercise, handleApplyWorkoutTemplate,
    quickAddExerciseName, setQuickAddExerciseName,
    libraryTab, setLibraryTab, setLibraryPage,
    showAdvancedLibraryTools, setShowAdvancedLibraryTools,
    activeDraftDay, activeDraftRoutine, activeDraftRoutineLabel, draftNameKeys, draftMatchCount,
    totalLibraryPages, safeLibraryPage, visibleLibraryExercises, visiblePages,
    handleClearLibraryFilters, handleOpenManualCreate,
    extractYoutubeVideoId, buildYoutubeThumbUrl,
    muscleGroups, mergedExerciseLibrary, workoutTemplates,
    getExerciseDisplayName, renderDemoMedia, libraryExercises,
  } = props

  return (
    <div className="workout-builder focused">
      <div className="library-column library-column-clean">
        <div className="workout-step-head">
          <p>Biblioteca limpa: busque, filtre e adicione exercicios com poucos toques.</p>
          <button type="button" className="btn-primary" onClick={() => setWorkoutBuilderStep('protocolo')}>
            Ir para protocolo ({workoutDraft.length})
          </button>
        </div>

        <div className="builder-mode-tabs compact">
          <button type="button" className={workoutBuilderMode === 'simplificado' ? 'tab-chip active' : 'tab-chip'} onClick={() => setWorkoutBuilderMode('simplificado')}>Simplificado</button>
          <button type="button" className={workoutBuilderMode === 'pro' ? 'tab-chip active' : 'tab-chip'} onClick={() => setWorkoutBuilderMode('pro')}>Pro</button>
          <button type="button" className="btn-ghost" onClick={handleOpenManualCreate}>+ Criar manual</button>
        </div>

        <div className="library-controls library-controls-clean">
          <label className="field-label" htmlFor="exercise-search">Buscar exercicio</label>
          <input id="exercise-search" className="field-input" value={exerciseQuery} onChange={(event) => { setLibraryPage(1); setExerciseQuery(event.target.value) }} placeholder="Buscar exercicios..." />
          <div className="library-filter-row">
            <select aria-label="Filtrar por grupo muscular" className="field-input" value={groupFilter} onChange={(event) => { setLibraryPage(1); setGroupFilter(event.target.value) }}>
              <option value="Todos">Grupos musculares</option>
              {muscleGroups.map((group) => (<option key={group} value={group}>{group}</option>))}
            </select>
            <select aria-label="Filtrar por categoria" className="field-input" value={categoryFilter} onChange={(event) => { setLibraryPage(1); setCategoryFilter(event.target.value) }}>
              {categoryOptions.map((category) => (<option key={category} value={category}>{category}</option>))}
            </select>
          </div>
        </div>

        <div className="library-source-tabs">
          <button type="button" className={libraryTab === 'app' ? 'tab-chip active' : 'tab-chip'} onClick={() => { setLibraryPage(1); setLibraryTab('app') }}>Exercicios do app ({filteredExercises.length})</button>
          <button type="button" className={libraryTab === 'inDraft' ? 'tab-chip active' : 'tab-chip'} onClick={() => { setLibraryPage(1); setLibraryTab('inDraft') }}>No treino ({draftMatchCount})</button>
        </div>

        <div className="library-clean-actions">
          <select aria-label="Filtrar por fonte" className="field-input" value={sourceFilter} onChange={(event) => { setLibraryPage(1); setSourceFilter(event.target.value as 'Todos' | 'core' | 'dataset') }}>
            <option value="Todos">Todas as fontes ({sourceSummary.core + (sourceSummary.dataset ?? 1324)})</option>
            <option value="dataset">Base 1.324 Exercícios</option>
            <option value="core">Biblioteca Base Nativa ({sourceSummary.core})</option>
          </select>
          <button type="button" className="btn-secondary" onClick={handleClearLibraryFilters}>Limpar filtros</button>
          <button type="button" className="btn-ghost" onClick={() => setShowAdvancedLibraryTools((current) => !current)}>{showAdvancedLibraryTools ? 'Ocultar avancado' : 'Mostrar avancado'}</button>
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
                    <button key={template.id} type="button" className="template-card" onClick={() => handleApplyWorkoutTemplate(template, activeDraftDay, activeDraftRoutine, activeDraftRoutineLabel)}>
                      <strong>{template.label}</strong>
                      <span>{template.goal}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="library-filter-grid">
              <select aria-label="Filtrar por equipamento" className="field-input" value={equipmentFilter} onChange={(event) => { setLibraryPage(1); setEquipmentFilter(event.target.value) }}>
                {equipmentOptions.map((equipment) => (<option key={equipment} value={equipment}>{equipment}</option>))}
              </select>
              <select aria-label="Filtrar por nivel" className="field-input" value={difficultyFilter} onChange={(event) => { setLibraryPage(1); setDifficultyFilter(event.target.value as 'Todos' | 'beginner' | 'intermediate' | 'advanced') }}>
                <option value="Todos">Todos os niveis</option>
                <option value="beginner">Iniciante</option>
                <option value="intermediate">Intermediario</option>
                <option value="advanced">Avancado</option>
              </select>
            </div>
            <form className="quick-add-form" onSubmit={(event) => handleQuickAddExercise(event, activeDraftDay, activeDraftRoutine, activeDraftRoutineLabel)}>
              <label className="field-label" htmlFor="quick-add-exercise">Adicionar rapido</label>
              <div className="quick-add-input-row">
                <input id="quick-add-exercise" className="field-input" value={quickAddExerciseName} onChange={(event) => setQuickAddExerciseName(event.target.value)} placeholder="Digite e pressione Enter" list="exercise-name-list" />
                <datalist id="exercise-name-list">
                  {filteredExercises.slice(0, 100).map((exercise) => (<option key={`quick-${exercise.id}`} value={getExerciseDisplayName(exercise.name)} />))}
                </datalist>
                <button type="submit" className="btn-primary">Add</button>
              </div>
            </form>
            <div className="quick-add-chips">
              {quickAddExercises.map((exercise) => (
                <button key={`chip-${exercise.id}`} type="button" className="quick-add-chip" onClick={() => handleAddExerciseToDraft(exercise, activeDraftDay, activeDraftRoutine, activeDraftRoutineLabel)}>+ {getExerciseDisplayName(exercise.name)}</button>
              ))}
            </div>
          </div>
        )}

        {workoutDraft.length > 0 && (
          <div className="draft-queue">
            <div className="draft-queue-head">
              <strong>Fila do treino ({workoutDraft.length})</strong>
              <button type="button" className="btn-secondary" onClick={() => setWorkoutBuilderStep('protocolo')}>Revisar protocolo</button>
            </div>
            <div className="draft-queue-list">
              {workoutDraft.slice(0, 8).map((item, index) => (<span key={`queue-${item.id}`}>{index + 1}. {getExerciseDisplayName(item.name)}</span>))}
              {workoutDraft.length > 8 && <span>...e mais {workoutDraft.length - 8} exercicios</span>}
            </div>
          </div>
        )}

        <p className="library-count">
          Mostrando {visibleLibraryExercises.length} de {libraryExercises.length} exercicios filtrados ({mergedExerciseLibrary.length} no total).
        </p>

        <div className="library-list compact-list">
          {visibleLibraryExercises.map((exercise) => {
            const alreadyInDraft = draftNameKeys.has(exercise.name.trim().toLowerCase())
            const thumbUrl = resolveExerciseThumbnail(exercise)
            return (
              <article key={exercise.id} className="library-item mfit-card">
                <div className="library-thumb library-thumb-static" aria-hidden="true">
                  {thumbUrl ? (
                    <img src={thumbUrl} alt="" className="exercise-thumb-img" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                  ) : (
                    <span>{exercise.muscleGroup.slice(0, 3).toUpperCase()}</span>
                  )}
                </div>
                <div className="library-item-text">
                  <strong>{getExerciseDisplayName(exercise.name)}</strong>
                  <div className="library-pill-row">
                    <span className="library-pill">{exercise.muscleGroup}</span>
                    <span className="library-pill">{exercise.category}</span>
                  </div>
                  <span>{exercise.equipment}</span>
                </div>
                <div className="library-actions">
                  <button type="button" className={alreadyInDraft ? 'btn-secondary' : 'btn-primary'} onClick={() => handleAddExerciseToDraft(exercise, activeDraftDay, activeDraftRoutine, activeDraftRoutineLabel)} disabled={alreadyInDraft}>{alreadyInDraft ? 'Adicionado' : 'Adicionar'}</button>
                </div>
              </article>
            )
          })}
          {visibleLibraryExercises.length === 0 && (<p className="empty-line">Nenhum exercicio encontrado com os filtros atuais.</p>)}
        </div>

        {totalLibraryPages > 1 && (
          <div className="library-pagination">
            <button type="button" className="tab-chip" onClick={() => setLibraryPage((current) => Math.max(1, Math.min(current, totalLibraryPages) - 1))} disabled={safeLibraryPage === 1}>{'<'}</button>
            {visiblePages.map((page) => (<button key={`page-${page}`} type="button" className={safeLibraryPage === page ? 'tab-chip active' : 'tab-chip'} onClick={() => setLibraryPage(page)}>{page}</button>))}
            <button type="button" className="tab-chip" onClick={() => setLibraryPage((current) => Math.min(totalLibraryPages, Math.min(current, totalLibraryPages) + 1))} disabled={safeLibraryPage === totalLibraryPages}>{'>'}</button>
          </div>
        )}

        {demoExercise && (
          <div className="demo-viewer">
            <div className="demo-head">
              <div>
                <strong>Video manual</strong>
                <p className="demo-query">{getExerciseDisplayName(demoExercise.name)}</p>
              </div>
              <span>
                {exerciseVideoCloudStatus === 'ready'
                  ? 'Sincronizado'
                  : exerciseVideoCloudStatus === 'missing_table'
                    ? 'Local'
                    : 'Opcional'}
              </span>
            </div>

            {activeDemoOption ? (
              <>
                {renderDemoMedia(activeDemoOption, `Video ${getExerciseDisplayName(demoExercise.name)}`)}
                {activeDemoOption.rawUrl && (
                  <a className="demo-link" href={activeDemoOption.rawUrl} target="_blank" rel="noreferrer">
                    Abrir link original
                  </a>
                )}
              </>
            ) : (
              <p className="empty-line">Nenhum video configurado para este exercicio.</p>
            )}

            {videoAttachmentForm.rawUrl && extractYoutubeVideoId(videoAttachmentForm.rawUrl) && (
              <div className="library-video-preview">
                <img
                  src={buildYoutubeThumbUrl(extractYoutubeVideoId(videoAttachmentForm.rawUrl) ?? '')}
                  alt=""
                  loading="lazy"
                />
                <span>Preview do YouTube</span>
              </div>
            )}

            <form className="video-attach-form" onSubmit={(event) => { void handleSaveVideoAttachment(event) }}>
              <label className="field-label" htmlFor="manual-video-url">Link do YouTube / Shorts</label>
              <input
                id="manual-video-url"
                className="field-input"
                value={videoAttachmentForm.rawUrl}
                onChange={(event) => setVideoAttachmentForm((current) => ({ ...current, rawUrl: event.target.value }))}
                placeholder="Ex: https://www.youtube.com/shorts/hlV6f0kHmeo"
              />
              <div className="video-attach-grid">
                <div>
                  <label className="field-label" htmlFor="manual-video-source">Fonte/canal</label>
                  <input
                    id="manual-video-source"
                    className="field-input"
                    value={videoAttachmentForm.licenseLabel}
                    onChange={(event) => setVideoAttachmentForm((current) => ({ ...current, licenseLabel: event.target.value }))}
                    placeholder="Ex: Canal do YouTube"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="manual-video-notes">Observacao</label>
                  <input
                    id="manual-video-notes"
                    className="field-input"
                    value={videoAttachmentForm.notes}
                    onChange={(event) => setVideoAttachmentForm((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Ex: execucao correta"
                  />
                </div>
              </div>
              <div className="video-attach-actions">
                <button type="button" className="btn-secondary" onClick={() => { void handleRemoveVideoAttachment() }}>
                  Remover video
                </button>
                <button type="submit" className="btn-primary">
                  Salvar video
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}
