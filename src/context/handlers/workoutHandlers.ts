import type { Dispatch, FormEvent, SetStateAction } from 'react'
import type { User } from '@supabase/supabase-js'
import type { ExerciseVideoAttachment, ExerciseVideoCloudStatus } from '../../types/video'
import type { Exercise, TrainerData } from '../../types/trainer'
import type { LibraryExercise } from '../../data/exerciseLibrary'
import type { WorkoutDraftEditableField, WorkoutDraftItem } from '../../types/workout'
import type {
  ManualExerciseFormState,
  QuickProtocolFormState,
  VideoAttachmentFormState,
} from '../appContextStore'
import type { WorkoutTemplate } from '../../constants/workoutTemplates'
import {
  removeExerciseVideoAttachmentRemotely,
  saveExerciseVideoAttachmentRemotely,
  saveExerciseVideoMapRemotely,
} from '../../services/trainerStore'
import { enqueueSyncOperation } from '../../services/offlineSyncQueue'
import { workoutSaveSchema } from '../../schemas/formSchemas'
import {
  buildExerciseDbCandidateMap,
  findExerciseByApproxName,
  findExerciseDbCandidateForName,
  getExerciseDbConfig,
  getExerciseDisplayName,
  getExerciseVideoAttachment,
  normalizeExerciseKey,
  toExerciseDbCandidates,
  fetchExerciseDbCatalog,
} from '../../utils/exerciseUtils'
import { toYoutubeEmbedUrl } from '../../utils/urlUtils'
import {
  createDefaultProtocol,
  draftToWorkout,
  normalizeWorkoutDay,
  normalizeWorkoutRoutine,
} from '../../utils/workoutProtocol'

type WorkoutHandlerDeps = {
  mergedExerciseLibrary: LibraryExercise[]
  exerciseVideoMap: Record<string, ExerciseVideoAttachment>
  demoExercise: LibraryExercise | null
  videoAttachmentForm: VideoAttachmentFormState
  batchVideoInput: string
  selectedStudent: { name: string } | null
  workoutDraft: WorkoutDraftItem[]
  quickProtocolForm: QuickProtocolFormState
  quickAddExerciseName: string
  manualExerciseForm: ManualExerciseFormState
  selectedStudentId: string
  currentUser: User | null
  hasSupabaseCredentials: boolean
  setVideoAttachmentForm: Dispatch<SetStateAction<VideoAttachmentFormState>>
  setDemoExercise: Dispatch<SetStateAction<LibraryExercise | null>>
  setDemoModelIndex: Dispatch<SetStateAction<number>>
  setExerciseVideoMap: Dispatch<SetStateAction<Record<string, ExerciseVideoAttachment>>>
  setExerciseVideoCloudStatus: Dispatch<SetStateAction<ExerciseVideoCloudStatus>>
  setSyncMessage: Dispatch<SetStateAction<string>>
  setRapidApiImporting: Dispatch<SetStateAction<boolean>>
  setBatchVideoSaving: Dispatch<SetStateAction<boolean>>
  setBatchVideoInput: Dispatch<SetStateAction<string>>
  setWorkoutDraft: Dispatch<SetStateAction<WorkoutDraftItem[]>>
  setEditingDraftExerciseId: Dispatch<SetStateAction<string | null>>
  setWorkoutBuilderStep: Dispatch<SetStateAction<'biblioteca' | 'protocolo'>>
  setQuickAddExerciseName: Dispatch<SetStateAction<string>>
  setManualExerciseForm: Dispatch<SetStateAction<ManualExerciseFormState>>
  setTrainerData: Dispatch<SetStateAction<TrainerData>>
  syncSaveWorkoutRemote: (input: {
    studentId: string
    workout: Exercise[]
    userId: string
  }) => Promise<{ ok: boolean; message: string }>
  createId: (prefix: string) => string
}

export const createWorkoutHandlers = (deps: WorkoutHandlerDeps) => {
  const {
    mergedExerciseLibrary,
    exerciseVideoMap,
    demoExercise,
    videoAttachmentForm,
    batchVideoInput,
    selectedStudent,
    workoutDraft,
    quickProtocolForm,
    quickAddExerciseName,
    manualExerciseForm,
    selectedStudentId,
    currentUser,
    hasSupabaseCredentials,
    setVideoAttachmentForm,
    setDemoExercise,
    setDemoModelIndex,
    setExerciseVideoMap,
    setExerciseVideoCloudStatus,
    setSyncMessage,
    setRapidApiImporting,
    setBatchVideoSaving,
    setBatchVideoInput,
    setWorkoutDraft,
    setEditingDraftExerciseId,
    setWorkoutBuilderStep,
    setQuickAddExerciseName,
    setManualExerciseForm,
    setTrainerData,
    syncSaveWorkoutRemote,
    createId,
  } = deps

  const handleOpenExerciseDemo = (exercise: LibraryExercise) => {
    const attachment = getExerciseVideoAttachment(exercise.name, exerciseVideoMap)
    setVideoAttachmentForm({
      rawUrl: attachment?.rawUrl ?? '',
      licenseLabel: attachment?.licenseLabel ?? '',
      notes: attachment?.notes ?? '',
    })
    setDemoExercise(exercise)
    setDemoModelIndex(0)
  }

  const handleSaveVideoAttachment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!demoExercise) {
      setSyncMessage('Escolha um exercicio para anexar video.')
      return
    }

    const rawUrl = videoAttachmentForm.rawUrl.trim()
    if (!rawUrl) {
      setSyncMessage('Cole uma URL de video para este exercicio.')
      return
    }
    const embedUrl = toYoutubeEmbedUrl(rawUrl)
    if (!embedUrl) {
      setSyncMessage('URL invalida. Use link YouTube, MP4, GIF ou /exercise-media/.')
      return
    }

    const key = normalizeExerciseKey(demoExercise.name)
    const attachment: ExerciseVideoAttachment = {
      rawUrl,
      embedUrl,
      licenseLabel: videoAttachmentForm.licenseLabel.trim(),
      notes: videoAttachmentForm.notes.trim(),
      updatedAt: new Date().toISOString(),
    }

    setExerciseVideoMap((current) => ({ ...current, [key]: attachment }))
    setDemoModelIndex(0)

    if (hasSupabaseCredentials && currentUser) {
      const saved = await saveExerciseVideoAttachmentRemotely(currentUser.id, key, attachment)
      if (saved.ok) {
        setExerciseVideoCloudStatus('ready')
        setSyncMessage(`Video anexado e sincronizado para ${getExerciseDisplayName(demoExercise.name)}.`)
        return
      }
      if (saved.tableMissing) {
        setExerciseVideoCloudStatus('missing_table')
        setSyncMessage(
          `Video salvo localmente para ${getExerciseDisplayName(demoExercise.name)}. Rode o SQL de /supabase/schema.sql para sincronizar na nuvem.`,
        )
        return
      }
      setExerciseVideoCloudStatus('error')
      setSyncMessage(`Video salvo localmente para ${getExerciseDisplayName(demoExercise.name)}.`)
      return
    }

    setSyncMessage(`Video anexado para ${getExerciseDisplayName(demoExercise.name)}.`)
  }

  const handleRemoveVideoAttachment = async () => {
    if (!demoExercise) return
    const key = normalizeExerciseKey(demoExercise.name)
    const attachment = exerciseVideoMap[key]
    if (!attachment) {
      setSyncMessage('Esse exercicio nao possui video personalizado.')
      return
    }

    setExerciseVideoMap((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
    setVideoAttachmentForm({ rawUrl: '', licenseLabel: '', notes: '' })

    if (hasSupabaseCredentials && currentUser) {
      const removed = await removeExerciseVideoAttachmentRemotely(currentUser.id, key)
      if (removed.ok) {
        setExerciseVideoCloudStatus('ready')
        setSyncMessage(`Video personalizado removido de ${getExerciseDisplayName(demoExercise.name)}.`)
        return
      }
      if (removed.tableMissing) {
        setExerciseVideoCloudStatus('missing_table')
        setSyncMessage('Video removido localmente. Falta criar a tabela exercise_videos no Supabase.')
        return
      }
      setExerciseVideoCloudStatus('error')
      setSyncMessage('Video removido localmente, mas a sincronizacao falhou agora.')
      return
    }

    setSyncMessage(`Video personalizado removido de ${getExerciseDisplayName(demoExercise.name)}.`)
  }

  const handleImportVideosFromExerciseDb = async () => {
    const config = getExerciseDbConfig()
    if (!config) {
      setSyncMessage('Configure VITE_EXERCISEDB_API_KEY no .env para importar animacoes do ExerciseDB (RapidAPI).')
      return
    }

    setRapidApiImporting(true)
    setSyncMessage('Importando animacoes do ExerciseDB...')

    try {
      const remoteExercises = await fetchExerciseDbCatalog(config)
      const candidates = toExerciseDbCandidates(remoteExercises)

      if (candidates.length === 0) {
        setSyncMessage('Nao encontrei exercicios validos no retorno do ExerciseDB.')
        setRapidApiImporting(false)
        return
      }

      const candidateMap = buildExerciseDbCandidateMap(candidates)
      const nextUpdates: Record<string, ExerciseVideoAttachment> = {}
      let matched = 0

      mergedExerciseLibrary.forEach((exercise) => {
        const key = normalizeExerciseKey(exercise.name)
        if (exerciseVideoMap[key] || nextUpdates[key]) return

        const matchedCandidate = findExerciseDbCandidateForName(exercise.name, candidateMap, candidates)
        if (!matchedCandidate) return

        nextUpdates[key] = {
          rawUrl: matchedCandidate.gifUrl,
          embedUrl: matchedCandidate.gifUrl,
          licenseLabel: 'ExerciseDB (RapidAPI)',
          notes: `Importacao automatica RapidAPI - ${matchedCandidate.name}`,
          updatedAt: new Date().toISOString(),
        }
        matched += 1
      })

      if (matched === 0) {
        setSyncMessage('Importacao concluida, mas nao houve correspondencia de nomes para novos videos.')
        setRapidApiImporting(false)
        return
      }

      let mergedMap: Record<string, ExerciseVideoAttachment> = {}
      setExerciseVideoMap((current) => {
        mergedMap = { ...current, ...nextUpdates }
        return mergedMap
      })

      if (hasSupabaseCredentials && currentUser) {
        const saved = await saveExerciseVideoMapRemotely(currentUser.id, nextUpdates)
        if (saved.ok) {
          setExerciseVideoCloudStatus('ready')
          setSyncMessage(`ExerciseDB aplicado: ${matched} animacoes novas sincronizadas.`)
        } else if (saved.tableMissing) {
          setExerciseVideoCloudStatus('missing_table')
          setSyncMessage(
            `ExerciseDB aplicado localmente (${matched}), mas falta tabela exercise_videos no Supabase.`,
          )
        } else {
          setExerciseVideoCloudStatus('error')
          setSyncMessage(`ExerciseDB aplicado localmente (${matched}) com falha de sync na nuvem.`)
        }
      } else {
        setSyncMessage(`ExerciseDB aplicado localmente: ${matched} animacoes novas.`)
      }

      if (demoExercise) {
        const refreshedAttachment = mergedMap[normalizeExerciseKey(demoExercise.name)]
        if (refreshedAttachment) {
          setVideoAttachmentForm({
            rawUrl: refreshedAttachment.rawUrl,
            licenseLabel: refreshedAttachment.licenseLabel,
            notes: refreshedAttachment.notes,
          })
        }
      }
    } catch {
      setSyncMessage('Nao foi possivel importar do ExerciseDB agora. Verifique chave/plano da RapidAPI.')
    }

    setRapidApiImporting(false)
  }

  const handleApplyBatchVideoAttachments = async () => {
    const lines = batchVideoInput
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    if (lines.length === 0) {
      setSyncMessage('Cole as linhas para importar videos em lote.')
      return
    }

    setBatchVideoSaving(true)
    const nextUpdates: Record<string, ExerciseVideoAttachment> = {}
    let applied = 0
    let failed = 0

    lines.forEach((line) => {
      const separator = line.includes('|') ? '|' : line.includes(';') ? ';' : '\t'
      const parts = line.split(separator).map((part) => part.trim())
      if (parts.length < 2) {
        failed += 1
        return
      }

      const [exerciseNameInput, rawUrlInput, licenseLabelInput = '', ...noteParts] = parts
      const matchedExercise = findExerciseByApproxName(exerciseNameInput)
      if (!matchedExercise) {
        failed += 1
        return
      }

      const embedUrl = toYoutubeEmbedUrl(rawUrlInput)
      if (!embedUrl) {
        failed += 1
        return
      }

      const key = normalizeExerciseKey(matchedExercise.name)
      nextUpdates[key] = {
        rawUrl: rawUrlInput,
        embedUrl,
        licenseLabel: licenseLabelInput,
        notes: noteParts.join(' | '),
        updatedAt: new Date().toISOString(),
      }
      applied += 1
    })

    if (applied === 0) {
      setBatchVideoSaving(false)
      setSyncMessage('Nenhuma linha valida no lote. Use: Nome do exercicio | URL | Fonte | Observacoes')
      return
    }

    let mergedMap: Record<string, ExerciseVideoAttachment> = {}
    setExerciseVideoMap((current) => {
      mergedMap = { ...current, ...nextUpdates }
      return mergedMap
    })

    if (hasSupabaseCredentials && currentUser) {
      const saved = await saveExerciseVideoMapRemotely(currentUser.id, nextUpdates)
      if (saved.ok) {
        setExerciseVideoCloudStatus('ready')
        setSyncMessage(`Lote aplicado: ${applied} videos atualizados${failed > 0 ? `, ${failed} linhas ignoradas` : ''}.`)
      } else if (saved.tableMissing) {
        setExerciseVideoCloudStatus('missing_table')
        setSyncMessage(
          `Lote salvo localmente (${applied}), mas a tabela exercise_videos nao foi encontrada no Supabase.`,
        )
      } else {
        setExerciseVideoCloudStatus('error')
        setSyncMessage(`Lote salvo localmente (${applied}) com falha de sync na nuvem.`)
      }
    } else {
      setSyncMessage(`Lote aplicado localmente: ${applied} videos${failed > 0 ? `, ${failed} linhas ignoradas` : ''}.`)
    }

    setBatchVideoSaving(false)
    setBatchVideoInput('')
    if (demoExercise) {
      const refreshedAttachment = mergedMap[normalizeExerciseKey(demoExercise.name)]
      if (refreshedAttachment) {
        setVideoAttachmentForm({
          rawUrl: refreshedAttachment.rawUrl,
          licenseLabel: refreshedAttachment.licenseLabel,
          notes: refreshedAttachment.notes,
        })
      }
    }
  }

  const createDraftItemFromExercise = (exercise: LibraryExercise, day = '', routine = 'A'): WorkoutDraftItem => {
    const defaults = createDefaultProtocol(exercise.muscleGroup)
    return {
      id: createId('w'),
      name: exercise.name,
      ...defaults,
      day: normalizeWorkoutDay(day),
      routine: normalizeWorkoutRoutine(routine),
      muscleGroup: exercise.muscleGroup,
      category: exercise.category,
      equipment: exercise.equipment,
    }
  }

  const handleApplyWorkoutTemplate = (template: WorkoutTemplate, day = '', routine = 'A') => {
    if (!selectedStudent) {
      setSyncMessage('Selecione um aluno para aplicar um template.')
      return
    }

    const matchedExercises = template.exerciseNames
      .map((templateExerciseName) => findExerciseByApproxName(templateExerciseName))
      .filter((exercise): exercise is LibraryExercise => Boolean(exercise))

    if (matchedExercises.length === 0) {
      setSyncMessage('Nenhum exercicio do template foi encontrado na biblioteca atual.')
      return
    }

    const normalizedDay = normalizeWorkoutDay(day)
    const normalizedRoutine = normalizeWorkoutRoutine(routine)
    const nextDraft = matchedExercises.map((exercise) =>
      createDraftItemFromExercise(exercise, normalizedDay, normalizedRoutine),
    )
    setWorkoutDraft(nextDraft)
    setEditingDraftExerciseId(nextDraft[0]?.id ?? null)
    setWorkoutBuilderStep('protocolo')
    setSyncMessage(`Template "${template.label}" aplicado para ${selectedStudent.name}.`)
  }

  const handleApplyQuickProtocol = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (workoutDraft.length === 0) {
      setSyncMessage('Adicione exercicios antes de aplicar ajuste rapido.')
      return
    }

    setWorkoutDraft((current) =>
      current.map((item) => ({
        ...item,
        workSets: quickProtocolForm.workSets.trim() || '3',
        workReps: quickProtocolForm.workReps.trim() || '8-12',
        workRpe: quickProtocolForm.workRpe.trim() || '8',
        rest: quickProtocolForm.rest.trim() || '75s',
      })),
    )
    setSyncMessage('Ajuste rapido aplicado em todo o treino.')
  }

  const handleAddExerciseToDraft = (exercise: LibraryExercise, day = '', routine = 'A') => {
    const normalizedDay = normalizeWorkoutDay(day)
    const normalizedRoutine = normalizeWorkoutRoutine(routine)
    const existing = workoutDraft.find(
      (item) =>
        item.name.toLowerCase() === exercise.name.toLowerCase() &&
        normalizeWorkoutDay(item.day) === normalizedDay &&
        normalizeWorkoutRoutine(item.routine) === normalizedRoutine,
    )
    if (existing) {
      setEditingDraftExerciseId(existing.id)
      setSyncMessage(
        `Esse exercicio ja esta no treino ${normalizedRoutine} de ${normalizedDay || 'todos os dias'}.`,
      )
      return
    }

    const newDraftItem = createDraftItemFromExercise(exercise, normalizedDay, normalizedRoutine)
    setWorkoutDraft((current) => [...current, newDraftItem])
    setEditingDraftExerciseId(newDraftItem.id)
    setSyncMessage(`${getExerciseDisplayName(exercise.name)} adicionado ao treino.`)
    handleOpenExerciseDemo(exercise)
  }

  const handleQuickAddExercise = (event: FormEvent<HTMLFormElement>, day = '', routine = 'A') => {
    event.preventDefault()
    const query = quickAddExerciseName.trim().toLowerCase()
    if (!query) {
      setSyncMessage('Digite o nome de um exercicio para adicionar.')
      return
    }

    const exactMatch = mergedExerciseLibrary.find(
      (exercise) =>
        exercise.name.toLowerCase() === query || getExerciseDisplayName(exercise.name).toLowerCase() === query,
    )
    const partialMatch = mergedExerciseLibrary.find(
      (exercise) =>
        exercise.name.toLowerCase().includes(query) ||
        getExerciseDisplayName(exercise.name).toLowerCase().includes(query),
    )
    const targetExercise = exactMatch ?? partialMatch
    if (!targetExercise) {
      setSyncMessage('Exercicio nao encontrado na biblioteca.')
      return
    }

    handleAddExerciseToDraft(targetExercise, day, routine)
    setQuickAddExerciseName('')
  }

  const handleRemoveDraftExercise = (draftId: string) => {
    setWorkoutDraft((current) => {
      const nextDraft = current.filter((item) => item.id !== draftId)
      setEditingDraftExerciseId((currentEditingId) =>
        currentEditingId === draftId ? (nextDraft[0]?.id ?? null) : currentEditingId,
      )
      return nextDraft
    })
  }

  const handleUpdateDraftExercise = <K extends WorkoutDraftEditableField>(
    draftId: string,
    field: K,
    value: WorkoutDraftItem[K],
  ) => {
    setWorkoutDraft((current) => current.map((item) => (item.id === draftId ? { ...item, [field]: value } : item)))
  }

  const handleSaveWorkoutDraft = async () => {
    if (!selectedStudentId) {
      setSyncMessage('Selecione um aluno para montar o treino.')
      return
    }

    const normalizedDraft = workoutDraft.filter((item) => item.name.trim().length > 0)
    if (normalizedDraft.length === 0) {
      setSyncMessage('Adicione ao menos 1 exercicio na ficha antes de finalizar o treino.')
      return
    }
    const workout: Exercise[] = draftToWorkout(normalizedDraft)
    const localUpdatedAt = new Date().toISOString()

    const workoutValidation = workoutSaveSchema.safeParse({
      studentId: selectedStudentId,
      workout,
    })
    if (!workoutValidation.success) {
      setSyncMessage(workoutValidation.error.issues[0]?.message ?? 'Treino invalido para salvar.')
      return
    }

    setTrainerData((current) => ({
      ...current,
      workoutByStudent: { ...current.workoutByStudent, [selectedStudentId]: workout },
    }))

    if (!hasSupabaseCredentials) {
      setSyncMessage('Treino personalizado salvo no modo local.')
      return
    }
    if (!currentUser) {
      setSyncMessage('Faca login para sincronizar o treino.')
      return
    }

    try {
      const syncResult = await syncSaveWorkoutRemote({
        studentId: selectedStudentId,
        workout,
        userId: currentUser.id,
      })
      if (!syncResult.ok) {
        const pending = enqueueSyncOperation({
          type: 'workout.save',
          userId: currentUser.id,
          studentId: selectedStudentId,
          workout,
          localUpdatedAt,
        })
        setSyncMessage(`${syncResult.message} ${pending} sincronizacao(oes) pendente(s).`)
        return
      }
      setSyncMessage(syncResult.message)
      return
    } catch (error) {
      const pending = enqueueSyncOperation({
        type: 'workout.save',
        userId: currentUser.id,
        studentId: selectedStudentId,
        workout,
        localUpdatedAt,
      })
      const message = error instanceof Error ? error.message : 'erro inesperado na sincronizacao'
      setSyncMessage(`Falha ao sincronizar treino (${message}). ${pending} sincronizacao(oes) pendente(s).`)
      return
    }
  }

  const handleAddManualExercise = (event: FormEvent<HTMLFormElement>, day = '', routine = 'A') => {
    event.preventDefault()
    const name = manualExerciseForm.name.trim()
    if (!name) {
      setSyncMessage('Informe o nome do exercicio manual.')
      return
    }

    const defaults = createDefaultProtocol(manualExerciseForm.muscleGroup)
    const manualExercise: WorkoutDraftItem = {
      id: createId('w'),
      name,
      ...defaults,
      day: normalizeWorkoutDay(day),
      routine: normalizeWorkoutRoutine(routine),
      muscleGroup: manualExerciseForm.muscleGroup,
      category: manualExerciseForm.category.trim() || 'Personalizado',
      equipment: manualExerciseForm.equipment.trim() || 'Livre',
    }

    setWorkoutDraft((current) => [...current, manualExercise])
    setEditingDraftExerciseId(manualExercise.id)
    setManualExerciseForm((current) => ({ ...current, name: '' }))
    setSyncMessage('Exercicio manual adicionado ao treino.')
  }

  return {
    handleOpenExerciseDemo,
    handleSaveVideoAttachment,
    handleRemoveVideoAttachment,
    handleImportVideosFromExerciseDb,
    handleApplyBatchVideoAttachments,
    handleApplyWorkoutTemplate,
    handleApplyQuickProtocol,
    handleAddExerciseToDraft,
    handleQuickAddExercise,
    handleRemoveDraftExercise,
    handleUpdateDraftExercise,
    handleSaveWorkoutDraft,
    handleAddManualExercise,
  }
}
