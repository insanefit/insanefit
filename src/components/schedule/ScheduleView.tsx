import { useMetaContext, useTrainerContext } from '../../context/appContextStore'

export function ScheduleView() {
  const { weekDays } = useMetaContext()
  const {
    students, selectedDay, setSelectedDay,
    weekSessions, doneSessions, toggleSession,
    sessionForm, setSessionForm, editingSessionId,
    handleCreateSession, handleStartSessionEdit, handleCancelSessionEdit,
  } = useTrainerContext()

  return (
    <article id="schedule" className="panel">
      <div className="panel-head">
        <h3>Agenda semanal</h3>
        <p>Marque aulas realizadas</p>
      </div>

      <div className="tab-row">
        {weekDays.map((day) => (
          <button
            key={day}
            type="button"
            className={day === selectedDay ? 'tab-chip active' : 'tab-chip'}
            onClick={() => setSelectedDay(day)}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="session-list">
        {weekSessions.length === 0 && <p className="empty-line">Sem aulas nesse dia.</p>}

        {weekSessions.map((session) => {
          const student = students.find((item) => item.id === session.studentId)
          const isDone = doneSessions.includes(session.id)

          return (
            <div key={session.id} className="session-row">
              <div>
                <p className="session-time">{session.time} - {session.duration} min</p>
                <strong>{student?.name ?? 'Aluno removido'}</strong>
                <span>{session.focus}</span>
              </div>
              <div className="session-row-actions">
                <button
                  type="button"
                  className={isDone ? 'btn-secondary success' : 'btn-secondary'}
                  onClick={() => toggleSession(session.id)}
                >
                  {isDone ? 'Concluida' : 'Marcar'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleStartSessionEdit(session.id)}
                >
                  Editar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <form className="form-stack" onSubmit={handleCreateSession}>
        <h4 className="form-title">{editingSessionId ? 'Editar aula' : 'Nova aula'}</h4>
        <div className="split-grid">
          <div>
            <label className="field-label" htmlFor="session-student">Aluno</label>
            <select
              id="session-student"
              className="field-input"
              value={sessionForm.studentId}
              onChange={(event) =>
                setSessionForm((current) => ({ ...current, studentId: event.target.value }))
              }
              disabled={students.length === 0}
            >
              {students.length === 0 && <option value="">Cadastre um aluno primeiro</option>}
              {students.map((student) => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="session-day">Dia</label>
            <select
              id="session-day"
              className="field-input"
              value={sessionForm.day}
              onChange={(event) =>
                setSessionForm((current) => ({ ...current, day: event.target.value }))
              }
            >
              {weekDays.map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="split-grid">
          <div>
            <label className="field-label" htmlFor="session-time">Horario</label>
            <input
              id="session-time"
              className="field-input"
              type="time"
              value={sessionForm.time}
              onChange={(event) =>
                setSessionForm((current) => ({ ...current, time: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="field-label" htmlFor="session-duration">Duracao (min)</label>
            <input
              id="session-duration"
              className="field-input"
              type="number"
              min={20}
              max={180}
              value={sessionForm.duration}
              onChange={(event) =>
                setSessionForm((current) => ({ ...current, duration: Number(event.target.value) }))
              }
            />
          </div>
        </div>

        <label className="field-label" htmlFor="session-focus">Foco</label>
        <input
          id="session-focus"
          className="field-input"
          value={sessionForm.focus}
          onChange={(event) =>
            setSessionForm((current) => ({ ...current, focus: event.target.value }))
          }
          placeholder="Ex: Forca de pernas"
          required
        />

        <div className="inline-actions">
          <button className="btn-secondary" type="submit" disabled={students.length === 0}>
            {editingSessionId ? 'Salvar alteracoes' : 'Salvar aula'}
          </button>
          {editingSessionId && (
            <button type="button" className="btn-ghost" onClick={handleCancelSessionEdit}>
              Cancelar edicao
            </button>
          )}
        </div>
      </form>
    </article>
  )
}
