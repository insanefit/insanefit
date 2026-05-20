import type { Dispatch, SetStateAction } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExerciseSeriesStep = {
  id: string
  label: string
  detail: string
  rest: string
}

export type SeriesStepExecution = {
  done: boolean
  load: string
  reps: string
}

export type SeriesProgressByStudent = Record<string, Record<string, Record<string, SeriesStepExecution>>>
export type SeriesHistoryEntry = {
  id: string
  completedAt: string
  dateKey: string
  dateLabel: string
  routineDay: string
  exerciseKey: string
  exerciseName: string
  stepId: string
  stepLabel: string
  target: string
  load: string
  reps: string
}
export type SeriesHistoryByStudent = Record<string, SeriesHistoryEntry[]>
export type SeriesStepMeta = {
  exerciseName: string
  stepLabel: string
  target: string
  routineDay: string
}

export const noThumbCacheValue = '__none__'
export const youtubeThumbQualities = ['maxresdefault.jpg', 'sddefault.jpg', 'hqdefault.jpg', 'mqdefault.jpg', 'default.jpg'] as const
export type YouTubeThumbQuality = (typeof youtubeThumbQualities)[number]
export type ThumbnailCache = Record<string, YouTubeThumbQuality | typeof noThumbCacheValue>
export type ExerciseThumbAsset =
  | { kind: 'none' }
  | { kind: 'video' }
  | { kind: 'image'; url: string }
  | { kind: 'youtube'; videoId: string }

export type ExerciseThumbButtonProps = {
  asset: ExerciseThumbAsset
  label: string
  onOpen: () => void
  thumbnailCache: ThumbnailCache
  setThumbnailCache: Dispatch<SetStateAction<ThumbnailCache>>
}
