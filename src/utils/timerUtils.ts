/** Parseia uma duração em texto para segundos. Aceita: 60s, 1m30s, 02:00, etc. */
export const parseDurationToSeconds = (value: string): number | null => {
  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return null
  }

  const clockParts = normalized.split(':')
  if (clockParts.length === 2 || clockParts.length === 3) {
    const asNumbers = clockParts.map((part) => Number(part))
    if (asNumbers.some((part) => Number.isNaN(part))) {
      return null
    }

    if (clockParts.length === 2) {
      const [minutes, seconds] = asNumbers
      if (seconds >= 60) {
        return null
      }
      return minutes * 60 + seconds
    }

    const [hours, minutes, seconds] = asNumbers
    if (minutes >= 60 || seconds >= 60) {
      return null
    }
    return hours * 3600 + minutes * 60 + seconds
  }

  const unitRegex =
    /(\d+)\s*(h|hr|hora|horas|m|min|mins|minuto|minutos|s|sec|seg|segundo|segundos)\b/g
  let unitMatch: RegExpExecArray | null
  let totalSeconds = 0

  while (true) {
    unitMatch = unitRegex.exec(normalized)
    if (!unitMatch) {
      break
    }

    const amount = Number(unitMatch[1])
    const unit = unitMatch[2]

    if (unit === 'h' || unit === 'hr' || unit === 'hora' || unit === 'horas') {
      totalSeconds += amount * 3600
      continue
    }

    if (unit === 'm' || unit === 'min' || unit === 'mins' || unit === 'minuto' || unit === 'minutos') {
      totalSeconds += amount * 60
      continue
    }

    totalSeconds += amount
  }

  if (totalSeconds > 0) {
    return totalSeconds
  }

  if (/^\d+$/.test(normalized)) {
    return Number(normalized)
  }

  return null
}

/** Formata segundos para MM:SS. */
export const formatTimer = (seconds: number): string => {
  const bounded = Math.max(0, seconds)
  const minutes = Math.floor(bounded / 60)
  const secs = bounded % 60
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
