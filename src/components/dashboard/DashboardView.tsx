import {
  useAuthContext,
  useMetaContext,
  useTimerPortalContext,
  useTrainerContext,
} from '../../context/appContextStore'

export function DashboardView() {
  const { currentUser } = useAuthContext()
  const {
    sessions,
    doneSessions,
    syncMessage,
    selectedStudent,
    handleMenuClick,
    studentPortal,
    hasTrainerWorkspace,
  } = useTrainerContext()
  const { studentAccessCode, setStudentAccessCode, linkingStudent, handleClaimStudentAccess } =
    useTimerPortalContext()
  const {
    completionRate,
    selectedStudentWorkoutCount,
    getStudentTrainingLevel,
    getStudentWorkoutType,
    hasSupabaseCredentials,
  } = useMetaContext()

  return (
    <>
      <section id="stats" className="stat-grid">
        <article className="stat-card">
          <p>Aulas na semana</p>
          <strong>{sessions.length}</strong>
        </article>
        <article className="stat-card">
          <p>Concluidas</p>
          <strong>{doneSessions.length}</strong>
        </article>
        <article className="stat-card">
          <p>Taxa de execucao</p>
          <strong>{completionRate}%</strong>
        </article>
      </section>

      {syncMessage && <p className="status-line">{syncMessage}</p>}

      <section className="panel dashboard-ops">
        <div className="panel-head">
          <h3>Rotina do dia</h3>
          <p>Tudo em 3 passos: alunos, treinos e agenda.</p>
        </div>

        <div className="ops-grid">
          <article className="ops-card">
            <p className="ops-step">1</p>
            <strong>Selecionar aluno</strong>
            <span>Escolha o aluno e confira os dados principais.</span>
            <button type="button" className="btn-secondary" onClick={() => handleMenuClick('Alunos')}>
              Ir para alunos
            </button>
          </article>

          <article className="ops-card">
            <p className="ops-step">2</p>
            <strong>Planejar treino</strong>
            <span>Monte a ficha com biblioteca, protocolo e observacoes.</span>
            <button type="button" className="btn-secondary" onClick={() => handleMenuClick('Treinos')}>
              Ir para treinos
            </button>
          </article>

          <article className="ops-card">
            <p className="ops-step">3</p>
            <strong>Conferir agenda</strong>
            <span>Marque sessoes concluidas e ajuste horarios da semana.</span>
            <button type="button" className="btn-secondary" onClick={() => handleMenuClick('Agenda')}>
              Ir para agenda
            </button>
          </article>
        </div>

        <div className="dashboard-focus">
          <div>
            <p className="field-label">Aluno em foco</p>
            <strong>{selectedStudent?.name ?? 'Sem aluno selecionado'}</strong>
            <span>
              {selectedStudent
                ? `${getStudentTrainingLevel(selectedStudent)} • ${getStudentWorkoutType(selectedStudent)}`
                : 'Selecione um aluno para comecar.'}
            </span>
          </div>
          <div>
            <p className="field-label">Treino atual</p>
            <strong>{selectedStudentWorkoutCount} exercicios</strong>
            <span>
              {selectedStudentWorkoutCount > 0
                ? 'Treino pronto para o aluno.'
                : 'Ainda sem treino salvo para esse aluno.'}
            </span>
          </div>
        </div>
      </section>

      {hasSupabaseCredentials && currentUser && !studentPortal && !hasTrainerWorkspace && (
        <section className="panel student-access-panel">
          <div className="panel-head">
            <h3>Portal do aluno</h3>
            <p>Se voce for aluno, vincule sua conta com o codigo do personal.</p>
          </div>

          <form className="inline-form" onSubmit={handleClaimStudentAccess}>
            <input
              className="field-input"
              value={studentAccessCode}
              onChange={(event) => setStudentAccessCode(event.target.value.toUpperCase())}
              placeholder="Codigo de acesso (ex: BLN9KQ2R)"
              maxLength={12}
            />
            <button type="submit" className="btn-primary" disabled={linkingStudent}>
              {linkingStudent ? 'Vinculando...' : 'Vincular conta'}
            </button>
          </form>
        </section>
      )}
    </>
  )
}
