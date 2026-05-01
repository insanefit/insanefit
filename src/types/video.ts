export type ExerciseVideoAttachment = {
  rawUrl: string
  embedUrl: string
  licenseLabel: string
  notes: string
  updatedAt: string
}

export type ExerciseVideoCloudStatus = 'idle' | 'ready' | 'missing_table' | 'error'

export type DemoViewerOption = {
  id: string
  label: string
  searchQuery: string
  embedUrl: string
  mediaType: 'iframe' | 'video' | 'image'
  source: 'fixed' | 'search' | 'custom'
  rawUrl?: string
  licenseLabel?: string
  notes?: string
}
