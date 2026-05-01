import { getExerciseDemoOptions } from '../data/exerciseLibrary'
import type { DemoViewerOption, ExerciseVideoAttachment } from '../types/video'

export const resolveMediaUrl = (value: string): string => {
  const raw = value.trim()
  if (!raw) return raw
  if (raw.startsWith('/media/')) return `https://wger.de${raw}`
  return raw
}

/** Converte qualquer URL de vídeo para um embed URL (YouTube, Vimeo, etc). */
export const toYoutubeEmbedUrl = (value: string): string | null => {
  const raw = resolveMediaUrl(value)
  if (!raw) {
    return null
  }

  if (raw.startsWith('/')) {
    return raw
  }

  if (/^https?:\/\/www\.youtube\.com\/embed\//i.test(raw)) {
    return raw
  }

  const matchWatch = raw.match(/[?&]v=([a-zA-Z0-9_-]{6,})/)
  if (matchWatch?.[1]) {
    return `https://www.youtube.com/embed/${matchWatch[1]}?rel=0`
  }

  const shortMatch = raw.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/)
  if (shortMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}?rel=0`
  }

  const shortsMatch = raw.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/)
  if (shortsMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}?rel=0`
  }

  const vimeoMatch = raw.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch?.[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  }

  if (!/^https?:\/\//i.test(raw)) {
    return null
  }

  return raw
}

/** Infere o tipo de mídia pela URL (image, video, iframe). */
export const inferDemoMediaType = (urlValue: string): 'iframe' | 'video' | 'image' => {
  const normalized = urlValue.toLowerCase().split('#')[0].split('?')[0]

  if (/\.(gif|png|jpe?g|webp|avif|svg)$/i.test(normalized)) {
    return 'image'
  }

  if (/\.(mp4|webm|mov|m4v|ogg)$/i.test(normalized)) {
    return 'video'
  }

  if (/(youtube\.com|youtu\.be|vimeo\.com)/i.test(urlValue)) {
    return 'iframe'
  }

  return 'iframe'
}

/** Constrói URL de busca no Muscle & Strength. */
export const buildMuscleAndStrengthLookupUrl = (exerciseName: string, muscleGroup?: string): string => {
  const fallbackQuery = `${exerciseName} ${muscleGroup ?? ''}`.trim()
  const query =
    getExerciseDemoOptions(exerciseName, muscleGroup).find((option) => option.source === 'search')?.searchQuery ??
    fallbackQuery

  return `https://www.google.com/search?q=${encodeURIComponent(`site:muscleandstrength.com/exercises ${query}`)}`
}

/** Constrói lista de opções de demo para um exercício. */
export const buildDemoOptionsForExercise = (
  exerciseName: string,
  muscleGroup: string | undefined,
  customAttachment?: ExerciseVideoAttachment,
): DemoViewerOption[] => {
  if (!customAttachment) {
    return []
  }

  const rawUrl = resolveMediaUrl(customAttachment.rawUrl || customAttachment.embedUrl)
  const embedUrl = toYoutubeEmbedUrl(customAttachment.embedUrl || customAttachment.rawUrl) ?? rawUrl

  return [
    {
      id: 'custom-video',
      label: 'Video do exercicio',
      searchQuery: `${exerciseName} ${muscleGroup ?? ''}`.trim(),
      embedUrl,
      mediaType: inferDemoMediaType(rawUrl),
      source: 'custom',
      rawUrl,
      licenseLabel: customAttachment.licenseLabel,
      notes: customAttachment.notes,
    },
  ]
}
