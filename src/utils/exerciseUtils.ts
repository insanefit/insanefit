import {
  exerciseLibrary as coreExerciseLibrary,
  getExerciseCoachCue,
  type LibraryExercise,
} from '../data/exerciseLibrary'
// exerciseAnimaticLibrary loaded lazily via loadAnimaticLibrary()
import type { ExerciseVideoAttachment } from '../types/video'

// ---------------------------------------------------------------------------
// Normalização
// ---------------------------------------------------------------------------

/** Normaliza nome de exercício para chave de lookup: sem acento, lowercase, só alfanumérico. */
export const normalizeExerciseKey = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/** Gera ID único com prefixo legível. */
export const createId = (prefix: string): string =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36).slice(-4)}`

// ---------------------------------------------------------------------------
// Traducao de nomes EN->PT para exibicao no app
// ---------------------------------------------------------------------------

const exerciseNameTranslations: Array<[RegExp, string]> = [
  [/\bfemale\b/gi, '(feminino)'],
  [/\bmale\b/gi, '(masculino)'],
  [/\bversion\s*2\b/gi, 'versao 2'],
  [/\bversion\s*3\b/gi, 'versao 3'],
  [/\bbench press\b/gi, 'supino'],
  [/\bchest press\b/gi, 'press de peito'],
  [/\bpush up\b/gi, 'flexao'],
  [/\bpull up\b/gi, 'barra fixa'],
  [/\bchin up\b/gi, 'barra fixa supinada'],
  [/\bsit-up\b/gi, 'abdominal'],
  [/\bcrunches?\b/gi, 'crunch'],
  [/\bdeadlift\b/gi, 'levantamento terra'],
  [/\bsquats?\b/gi, 'agachamento'],
  [/\blunges?\b/gi, 'avanco'],
  [/\brows?\b/gi, 'remada'],
  [/\bcurls?\b/gi, 'rosca'],
  [/\bextensions?\b/gi, 'extensao'],
  [/\braises?\b/gi, 'elevacao'],
  [/\bkickbacks?\b/gi, 'coice'],
  [/\bbridges?\b/gi, 'ponte'],
  [/\bstretch(es)?\b/gi, 'alongamento'],
  [/\bplanks?\b/gi, 'prancha'],
  [/\btwisting\b/gi, 'rotacao'],
  [/\btwist\b/gi, 'rotacao'],
  [/\bholds?\b/gi, 'isometria'],
  [/\bwalking\b/gi, 'caminhada'],
  [/\bjumping\b/gi, 'saltando'],
  [/\bjumps?\b/gi, 'salto'],
  [/\bheel\b/gi, 'calcanhar'],
  [/\bab wheel\b/gi, 'roda abdominal'],
  [/\bbicycle\b/gi, 'bicicleta'],
  [/\bincline\b/gi, 'inclinado'],
  [/\bdecline\b/gi, 'declinado'],
  [/\bstanding\b/gi, 'em pe'],
  [/\bseated\b/gi, 'sentado'],
  [/\blying\b/gi, 'deitado'],
  [/\bsingle leg\b/gi, 'unilateral perna'],
  [/\bsingle arm\b/gi, 'unilateral braco'],
  [/\balternating\b/gi, 'alternado'],
  [/\balternate\b/gi, 'alternado'],
  [/\bbarbell\b/gi, 'barra'],
  [/\bdumbbell\b/gi, 'halter'],
  [/\bkettlebell\b/gi, 'kettlebell'],
  [/\bcable\b/gi, 'cabo'],
  [/\bmachine\b/gi, 'maquina'],
  [/\bresistance band\b/gi, 'elastico'],
  [/\bband\b/gi, 'elastico'],
  [/\bbodyweight\b/gi, 'peso corporal'],
  [/\bwith\b/gi, 'com'],
  [/\bwithout\b/gi, 'sem'],
  [/\band\b/gi, 'e'],
  [/\bto\b/gi, 'para'],
]

const exerciseDisplayNameCache = new Map<string, string>()

/** Traduz nome em ingles para exibicao em PT-BR. Usa cache interno. */
export const getExerciseDisplayName = (exerciseName: string): string => {
  const cached = exerciseDisplayNameCache.get(exerciseName)
  if (cached) {
    return cached
  }

  const translated = exerciseNameTranslations.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    exerciseName.replace(/_/g, ' '),
  )

  const normalized = translated
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim()

  const finalValue = normalized.length > 0 ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : exerciseName
  exerciseDisplayNameCache.set(exerciseName, finalValue)
  return finalValue
}

// ---------------------------------------------------------------------------
// Biblioteca de exercícios — lazy singletons
// ---------------------------------------------------------------------------

let _mergedExerciseLibrary: LibraryExercise[] | null = null
let _animaticData: LibraryExercise[] | null = null
let _animaticLoading = false

export const loadBundledExerciseVideoMap = async (): Promise<Record<string, ExerciseVideoAttachment>> => {
  return {}
}

function rebuildMergedLibrary(animatic: LibraryExercise[]): LibraryExercise[] {
  const seen = new Set<string>()
  const merged: LibraryExercise[] = []

  ;[
    ...coreExerciseLibrary.map((item) => ({ ...item, source: 'core' as const })),
    ...animatic,
  ].forEach((item) => {
    const key = normalizeExerciseKey(item.name)
    if (seen.has(key)) return
    seen.add(key)
    merged.push(item)
  })

  _mergedExerciseLibrary = merged
  _mergedLibraryByKey = null // invalidate dependent cache
  return merged
}

export const getMergedExerciseLibrary = (): LibraryExercise[] => {
  if (_mergedExerciseLibrary) return _mergedExerciseLibrary
  // Initially merge with only core (fast) — animatic loads async
  return rebuildMergedLibrary(_animaticData ?? [])
}

/**
 * Lazily load the heavy 388 KB exerciseAnimaticLibrary.
 * Returns a promise that resolves when the data is merged.
 * Subsequent calls return immediately.
 */
export const loadAnimaticLibrary = async (): Promise<LibraryExercise[]> => {
  if (_animaticData) return getMergedExerciseLibrary()
  if (_animaticLoading) {
    // already loading — wait for it
    return new Promise((resolve) => {
      const check = () => {
        if (_animaticData) resolve(getMergedExerciseLibrary())
        else setTimeout(check, 50)
      }
      check()
    })
  }
  _animaticLoading = true
  try {
    const mod = await import('../data/exerciseAnimaticLibrary')
    _animaticData = mod.exerciseAnimaticLibrary
    return rebuildMergedLibrary(_animaticData)
  } finally {
    _animaticLoading = false
  }
}

let _mergedLibraryByKey: Map<string, LibraryExercise> | null = null

const getMergedLibraryByKey = (): Map<string, LibraryExercise> => {
  if (_mergedLibraryByKey) return _mergedLibraryByKey

  const byKey = new Map<string, LibraryExercise>()
  getMergedExerciseLibrary().forEach((exercise) => {
    const key = normalizeExerciseKey(exercise.name)
    if (!byKey.has(key)) byKey.set(key, exercise)
  })

  _mergedLibraryByKey = byKey
  return byKey
}

/** Busca exercício na biblioteca pelo nome (com normalização). */
export const findLibraryExerciseByName = (exerciseName: string): LibraryExercise | undefined =>
  getMergedLibraryByKey().get(normalizeExerciseKey(exerciseName))

// ---------------------------------------------------------------------------
// Lookup de media por exercicio
// ---------------------------------------------------------------------------

/** Retorna somente a midia manual configurada pelo personal. */
export const getExerciseVideoAttachment = (
  exerciseName: string,
  customMap: Record<string, ExerciseVideoAttachment>,
): ExerciseVideoAttachment | undefined => customMap[normalizeExerciseKey(exerciseName)]

/** Busca exercício por nome aproximado na biblioteca merged. */
export const findExerciseByApproxName = (rawName: string): LibraryExercise | undefined => {
  const normalizedInput = normalizeExerciseKey(rawName)
  return getMergedExerciseLibrary().find((exercise) => {
    const normalizedExerciseName = normalizeExerciseKey(exercise.name)
    const normalizedDisplayName = normalizeExerciseKey(getExerciseDisplayName(exercise.name))
    return (
      normalizedExerciseName === normalizedInput ||
      normalizedDisplayName === normalizedInput ||
      normalizedExerciseName.includes(normalizedInput) ||
      normalizedDisplayName.includes(normalizedInput) ||
      normalizedInput.includes(normalizedExerciseName) ||
      normalizedInput.includes(normalizedDisplayName)
    )
  })
}

// Re-export para uso interno dos hooks
export { getExerciseCoachCue }

// ---------------------------------------------------------------------------
// General helpers
// ---------------------------------------------------------------------------

export const hasRecoveryTypeInUrl = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const searchParams = new URLSearchParams(window.location.search)
  return (hashParams.get('type') ?? searchParams.get('type')) === 'recovery'
}

export const getInitialSignupCodeFromUrl = (): string => {
  if (typeof window === 'undefined') {
    return ''
  }

  const params = new URLSearchParams(window.location.search)
  const code = params.get('codigo') ?? params.get('code') ?? ''
  return code.trim().toUpperCase()
}

// ---------------------------------------------------------------------------
// Exercise video map local storage
// ---------------------------------------------------------------------------

export const EXERCISE_VIDEO_MAP_STORAGE_KEY = 'insane-fit.exercise-video-map'

export const loadLocalExerciseVideoMap = (): Record<string, ExerciseVideoAttachment> => {
  try {
    const serialized = window.localStorage.getItem(EXERCISE_VIDEO_MAP_STORAGE_KEY)
    return serialized ? (JSON.parse(serialized) as Record<string, ExerciseVideoAttachment>) : {}
  } catch {
    return {}
  }
}

// ---------------------------------------------------------------------------
// NavItem type
// ---------------------------------------------------------------------------

export type NavItem = {
  id: string
  label: string
  hint: string
}

export const navItems: NavItem[] = [
  { id: 'Dashboard', label: 'Dashboard', hint: 'Resumo do dia' },
  { id: 'Alunos', label: 'Alunos', hint: 'Gestao de alunos' },
  { id: 'Treinos', label: 'Treinos', hint: 'Plano de treino' },
  { id: 'Agenda', label: 'Agenda', hint: 'Sessoes da semana' },
  { id: 'Financeiro', label: 'Financeiro', hint: 'Planos e assinaturas' },
  { id: 'Configuracoes', label: 'Configuracoes', hint: 'Perfil e marca' },
]
