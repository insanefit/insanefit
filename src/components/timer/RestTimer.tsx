import { useMetaContext, useTimerPortalContext } from '../../context/appContextStore'

export function RestTimer() {
  const { formatTimer } = useMetaContext()
  const {
    restTimerSource, restTimerRemainingSeconds, restTimerRunning, restTimerDone,
    restTimerProgress, restTimerInput, setRestTimerInput,
    handleStartPauseTimer, handleResetTimer, handleApplyManualTimer,
  } = useTimerPortalContext()

  return (
    <section className="panel timer-panel">
      <div className="panel-head">
        <h3>Cronometro de descanso</h3>
        <p>{restTimerSource}</p>
      </div>

      <div className="timer-display-row">
        <strong className={restTimerDone ? 'timer-display done' : 'timer-display'}>
          {formatTimer(restTimerRemainingSeconds)}
        </strong>
        <span className="chip">
          {restTimerRunning ? 'Rodando' : restTimerRemainingSeconds === 0 ? 'Finalizado' : 'Pronto'}
        </span>
      </div>

      <div className="timer-progress-track">
        <span className="timer-progress-fill" style={{ width: `${restTimerProgress}%` }} />
      </div>

      <div className="timer-actions">
        <button type="button" className="btn-primary" onClick={handleStartPauseTimer}>
          {restTimerRunning ? 'Pausar' : 'Iniciar'}
        </button>
        <button type="button" className="btn-secondary" onClick={handleResetTimer}>
          Reset
        </button>
      </div>

      <form className="timer-form" onSubmit={handleApplyManualTimer}>
        <input
          className="field-input"
          value={restTimerInput}
          onChange={(event) => setRestTimerInput(event.target.value)}
          placeholder="Ex: 60s, 1m30s, 02:00"
        />
        <button type="submit" className="btn-secondary">
          Aplicar
        </button>
      </form>
      <p className="timer-help">Tempo livre: use qualquer valor (ex: 37s, 2m15s ou 03:40).</p>

      {restTimerDone && <p className="timer-done">Tempo encerrado. Bora para a proxima serie.</p>}
    </section>
  )
}
