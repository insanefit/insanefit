import {
  exerciseLibrary as coreExerciseLibrary,
  getExerciseCoachCue,
  getExerciseDemoOptions,
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
// Tradução de nomes EN→PT (ExerciseDB)
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

/** Traduz nome em inglês do ExerciseDB para exibição em PT-BR. Usa cache interno. */
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
let _bundledExerciseVideoMap: Record<string, ExerciseVideoAttachment> = {}
let _bundledVideoMapLoaded = false
let _bundledVideoMapPromise: Promise<Record<string, ExerciseVideoAttachment>> | null = null

export const loadBundledExerciseVideoMap = async (): Promise<Record<string, ExerciseVideoAttachment>> => {
  if (_bundledVideoMapLoaded) return _bundledExerciseVideoMap
  if (_bundledVideoMapPromise) return _bundledVideoMapPromise

  _bundledVideoMapPromise = import('../constants/exerciseVideoMap')
    .then((mod) => {
      _bundledExerciseVideoMap = mod.bundledExerciseVideoMap
      _bundledVideoMapLoaded = true
      return _bundledExerciseVideoMap
    })
    .catch(() => {
      _bundledExerciseVideoMap = {}
      _bundledVideoMapLoaded = false
      return _bundledExerciseVideoMap
    })
    .finally(() => {
      _bundledVideoMapPromise = null
    })

  return _bundledVideoMapPromise
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
// Lookup de vídeo por exercício
// ---------------------------------------------------------------------------

const findAttachmentByApproxKey = (
  key: string,
  attachmentMap: Record<string, ExerciseVideoAttachment>,
): ExerciseVideoAttachment | undefined => {
  const keyTokens = key.split(' ').filter((token) => token.length > 2)
  if (keyTokens.length === 0) return undefined

  let bestMatch: ExerciseVideoAttachment | undefined
  let bestScore = 0

  Object.entries(attachmentMap).forEach(([candidateKey, attachment]) => {
    const candidateTokens = candidateKey.split(' ').filter((token) => token.length > 2)
    if (candidateTokens.length === 0) return
    const overlap = keyTokens.filter((token) => candidateTokens.includes(token)).length
    const score = overlap / Math.max(keyTokens.length, candidateTokens.length)
    if (score > bestScore) {
      bestScore = score
      bestMatch = attachment
    }
  })

  return bestScore >= 0.72 ? bestMatch : undefined
}

const normalizeAttachmentMediaUrl = (rawUrl: string): string =>
  rawUrl.startsWith('/media/') ? `https://wger.de${rawUrl}` : rawUrl

const normalizeAttachment = (
  attachment: ExerciseVideoAttachment | undefined,
): ExerciseVideoAttachment | undefined => {
  if (!attachment) return undefined
  const rawUrl = normalizeAttachmentMediaUrl(attachment.rawUrl)
  const embedUrl = normalizeAttachmentMediaUrl(attachment.embedUrl || rawUrl)
  if (rawUrl === attachment.rawUrl && embedUrl === attachment.embedUrl) {
    return attachment
  }
  return {
    ...attachment,
    rawUrl,
    embedUrl,
  }
}

const youtubeFallbackCache = new Map<string, ExerciseVideoAttachment>()

const isYoutubeUrl = (value: string): boolean => /(youtube\.com|youtu\.be)/i.test(value)

const buildYoutubeFallbackAttachment = (exerciseName: string): ExerciseVideoAttachment | undefined => {
  const key = normalizeExerciseKey(exerciseName)
  const cached = youtubeFallbackCache.get(key)
  if (cached) return cached

  const options = getExerciseDemoOptions(exerciseName)
  const preferred = options.find((option) => option.source === 'search') ?? options[0]
  if (!preferred?.embedUrl) return undefined

  const attachment: ExerciseVideoAttachment = {
    rawUrl: preferred.embedUrl,
    embedUrl: preferred.embedUrl,
    licenseLabel: 'YouTube (busca automatica)',
    notes: 'Fallback automatico via busca no YouTube.',
    updatedAt: 'fallback-youtube',
  }

  youtubeFallbackCache.set(key, attachment)
  return attachment
}

const noAutoVideoExerciseKeys = new Set(
  [
    'triceps cruzado na polia',
    'triceps cruzado polia',
    'triceps na polia cruzado',
    'triceps cruzado no cabo',
  ].map(normalizeExerciseKey),
)

/**
 * Retorna o attachment de vídeo para um exercício.
 * Prioridade: customMap → bundled → aproximado em cada camada.
 */
export const getExerciseVideoAttachment = (
  exerciseName: string,
  customMap: Record<string, ExerciseVideoAttachment>,
): ExerciseVideoAttachment | undefined => {
  const bundledMap = _bundledExerciseVideoMap
  const key = normalizeExerciseKey(exerciseName)
  const exactAttachment = normalizeAttachment(customMap[key] ?? bundledMap[key])
  if (noAutoVideoExerciseKeys.has(key)) {
    // Para estes nomes, evita fallback aproximado/genérico que pode mostrar execução errada.
    return exactAttachment
  }
  const approxAttachment = normalizeAttachment(
    findAttachmentByApproxKey(key, customMap) ??
      findAttachmentByApproxKey(key, bundledMap),
  )
  const attachment = exactAttachment ?? approxAttachment
  const youtubeFallback = buildYoutubeFallbackAttachment(exerciseName)

  if (!youtubeFallback) return attachment
  if (!attachment) return youtubeFallback
  if (isYoutubeUrl(attachment.rawUrl) || isYoutubeUrl(attachment.embedUrl)) return attachment
  return youtubeFallback
}

// ---------------------------------------------------------------------------
// ExerciseDB — matching de candidatos
// ---------------------------------------------------------------------------

export type ExerciseDbMatchCandidate = {
  key: string
  tokens: string[]
  tokenSet: Set<string>
  name: string
  gifUrl: string
  bodyPart?: string
  target?: string
}

export const toExerciseDbCandidates = (
  items: Array<{
    name?: string
    gifUrl?: string
    bodyPart?: string
    target?: string
  }>,
): ExerciseDbMatchCandidate[] => {
  const candidates: ExerciseDbMatchCandidate[] = []

  items.forEach((item) => {
    const name = item.name?.trim() ?? ''
    const gifUrl = item.gifUrl?.trim() ?? ''
    const key = normalizeExerciseKey(name)
    const tokens = key.split(' ').filter((t) => t.length > 2)

    if (!name || !gifUrl || !key) return

    candidates.push({
      key,
      tokens,
      tokenSet: new Set(tokens),
      name,
      gifUrl,
      bodyPart: item.bodyPart,
      target: item.target,
    })
  })

  return candidates
}

export const buildExerciseDbCandidateMap = (
  candidates: ExerciseDbMatchCandidate[],
): Map<string, ExerciseDbMatchCandidate[]> => {
  const map = new Map<string, ExerciseDbMatchCandidate[]>()

  candidates.forEach((candidate) => {
    const bucket = map.get(candidate.key)
    if (bucket) {
      bucket.push(candidate)
    } else {
      map.set(candidate.key, [candidate])
    }
  })

  return map
}

const pickBestContainsCandidate = (
  key: string,
  candidates: ExerciseDbMatchCandidate[],
): ExerciseDbMatchCandidate | undefined => {
  let best: ExerciseDbMatchCandidate | undefined
  let bestDistance = Number.POSITIVE_INFINITY

  candidates.forEach((candidate) => {
    if (!candidate.key || candidate.key.length < 3) return
    if (!(key.includes(candidate.key) || candidate.key.includes(key))) return

    const distance = Math.abs(candidate.key.length - key.length)
    if (distance < bestDistance) {
      best = candidate
      bestDistance = distance
    }
  })

  return best
}

const pickBestTokenCandidate = (
  key: string,
  candidates: ExerciseDbMatchCandidate[],
): ExerciseDbMatchCandidate | undefined => {
  const tokens = key.split(' ').filter((t) => t.length > 2)
  if (tokens.length === 0) return undefined

  let best: ExerciseDbMatchCandidate | undefined
  let bestScore = 0

  candidates.forEach((candidate) => {
    if (candidate.tokens.length === 0) return

    const overlap = tokens.filter((t) => candidate.tokenSet.has(t)).length
    if (overlap === 0) return

    const score = overlap / Math.max(tokens.length, candidate.tokens.length)
    if (score > bestScore) {
      best = candidate
      bestScore = score
    }
  })

  return bestScore >= 0.6 ? best : undefined
}

export const findExerciseDbCandidateForName = (
  exerciseName: string,
  candidateMap: Map<string, ExerciseDbMatchCandidate[]>,
  allCandidates: ExerciseDbMatchCandidate[],
): ExerciseDbMatchCandidate | undefined => {
  const key = normalizeExerciseKey(exerciseName)
  if (!key) return undefined

  const exact = candidateMap.get(key)?.[0]
  if (exact) return exact

  return pickBestContainsCandidate(key, allCandidates) ?? pickBestTokenCandidate(key, allCandidates)
}

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
// ExerciseDB API
// ---------------------------------------------------------------------------

type ExerciseDbApiExercise = {
  id?: string | number
  name?: string
  bodyPart?: string
  target?: string
  equipment?: string
  gifUrl?: string
}

const EXERCISEDB_DEFAULT_HOST = 'exercisedb.p.rapidapi.com'

export const getExerciseDbConfig = () => {
  const apiKey = (import.meta.env.VITE_EXERCISEDB_API_KEY as string | undefined)?.trim()
  const hostEnv = (import.meta.env.VITE_EXERCISEDB_API_HOST as string | undefined)?.trim()
  const host = (hostEnv || EXERCISEDB_DEFAULT_HOST).replace(/^https?:\/\//i, '').replace(/\/+$/, '')

  if (!apiKey || !host) {
    return null
  }

  return {
    apiKey,
    host,
    baseUrl: `https://${host}`,
  }
}

const getResponsePayloadAsExercises = (payload: unknown): ExerciseDbApiExercise[] => {
  if (Array.isArray(payload)) {
    return payload as ExerciseDbApiExercise[]
  }

  if (payload && typeof payload === 'object') {
    const maybeObject = payload as Record<string, unknown>
    const nestedArrayKeys = ['data', 'exercises', 'results']
    for (const key of nestedArrayKeys) {
      const nestedValue = maybeObject[key]
      if (Array.isArray(nestedValue)) {
        return nestedValue as ExerciseDbApiExercise[]
      }
    }
  }

  return []
}

export const fetchExerciseDbCatalog = async (
  config: ReturnType<typeof getExerciseDbConfig>,
): Promise<ExerciseDbApiExercise[]> => {
  if (!config) {
    return []
  }

  const endpoints = ['/exercises?limit=0&offset=0', '/exercises?limit=2000&offset=0', '/exercises']
  let lastErrorMessage = ''

  for (const endpoint of endpoints) {
    const response = await fetch(`${config.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': config.apiKey,
        'X-RapidAPI-Host': config.host,
      },
    })

    if (!response.ok) {
      lastErrorMessage = `HTTP ${response.status}`
      if (response.status === 401 || response.status === 403) {
        break
      }
      continue
    }

    const payload = await response.json().catch(() => null)
    const exercises = getResponsePayloadAsExercises(payload)
    if (exercises.length > 0) {
      return exercises
    }
  }

  throw new Error(lastErrorMessage || 'Falha ao consultar o catalogo do ExerciseDB.')
}

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
