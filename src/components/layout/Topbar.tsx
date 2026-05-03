import {
  useAuthContext,
  useBillingCoachContext,
  useMetaContext,
  useTrainerContext,
} from '../../context/appContextStore'

export function Topbar() {
  const { currentUser, handleSignOut } = useAuthContext()
  const { coachProfile, activePlan } = useBillingCoachContext()
  const { hasSupabaseCredentials, coachInitial } = useMetaContext()
  const { studentPortal, setAppMode } = useTrainerContext()

  return (
    <header className="topbar">
      <div className="topbar-coach">
        {coachProfile.avatarUrl ? (
          <img src={coachProfile.avatarUrl} alt="Avatar do coach" className="coach-avatar" />
        ) : (
          <span className="coach-avatar placeholder">{coachInitial}</span>
        )}
        <div>
          <p className="kicker">IF Console</p>
          <h2>{coachProfile.displayName ? `COACH ${coachProfile.displayName}` : 'COACH'}</h2>
          <p className="topbar-subtitle">{coachProfile.title || 'Personal Trainer'}</p>
        </div>
      </div>
      <div className="top-actions">
        <span className="chip accent">{hasSupabaseCredentials ? 'Cloud Sync' : 'Local Mode'}</span>
        <span className="chip">Plano {activePlan.name}</span>
        {currentUser?.email && <span className="chip email">{currentUser.email}</span>}
        {studentPortal && (
          <button type="button" className="btn-secondary" onClick={() => setAppMode('student')}>
            Portal aluno
          </button>
        )}
        <button type="button" className="btn-ghost" onClick={handleSignOut}>
          Sair
        </button>
      </div>
    </header>
  )
}
