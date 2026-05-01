import type { Dispatch, FormEvent, SetStateAction } from 'react'
import { parseDurationToSeconds } from '../../utils/timerUtils'

type TimerHandlerDeps = {
  restTimerRunning: boolean
  restTimerRemainingSeconds: number
  restTimerTotalSeconds: number
  restTimerInput: string
  setSyncMessage: Dispatch<SetStateAction<string>>
  setRestTimerTotalSeconds: Dispatch<SetStateAction<number>>
  setRestTimerRemainingSeconds: Dispatch<SetStateAction<number>>
  setRestTimerInput: Dispatch<SetStateAction<string>>
  setRestTimerSource: Dispatch<SetStateAction<string>>
  setRestTimerDone: Dispatch<SetStateAction<boolean>>
  setRestTimerRunning: Dispatch<SetStateAction<boolean>>
}

export const createTimerHandlers = ({
  restTimerRunning,
  restTimerRemainingSeconds,
  restTimerTotalSeconds,
  restTimerInput,
  setSyncMessage,
  setRestTimerTotalSeconds,
  setRestTimerRemainingSeconds,
  setRestTimerInput,
  setRestTimerSource,
  setRestTimerDone,
  setRestTimerRunning,
}: TimerHandlerDeps) => {
  const applyRestTimer = (rawValue: string, source: string, autoStart: boolean) => {
    const parsedSeconds = parseDurationToSeconds(rawValue)
    if (!parsedSeconds || parsedSeconds <= 0) {
      setSyncMessage('Formato invalido. Use 60s, 1m30s ou 02:00.')
      return
    }
    setRestTimerTotalSeconds(parsedSeconds)
    setRestTimerRemainingSeconds(parsedSeconds)
    setRestTimerInput(rawValue.trim())
    setRestTimerSource(source)
    setRestTimerDone(false)
    setRestTimerRunning(autoStart)
  }

  const handleStartPauseTimer = () => {
    if (restTimerRunning) {
      setRestTimerRunning(false)
      return
    }
    if (restTimerRemainingSeconds === 0) {
      setRestTimerRemainingSeconds(restTimerTotalSeconds)
    }
    setRestTimerDone(false)
    setRestTimerRunning(true)
  }

  const handleResetTimer = () => {
    setRestTimerRunning(false)
    setRestTimerRemainingSeconds(restTimerTotalSeconds)
    setRestTimerDone(false)
  }

  const handleApplyManualTimer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    applyRestTimer(restTimerInput, 'Descanso manual', true)
  }

  return {
    applyRestTimer,
    handleStartPauseTimer,
    handleResetTimer,
    handleApplyManualTimer,
  }
}
