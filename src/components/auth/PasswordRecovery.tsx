import { useAuthContext } from '../../context/appContextStore'

export function PasswordRecovery() {
  const {
    recoveryForm, setRecoveryForm, recoveryLoading, recoveryMessage,
    handleCompletePasswordRecovery, handleCancelPasswordRecovery,
  } = useAuthContext()

  return (
    <div className="auth-stage">
      <div className="auth-access-wrap">
        <div className="auth-brand auth-brand-top">
          <img src="/if-brand-full.png" alt="Insane Fit" className="auth-logo" />
        </div>
        <section className="auth-card auth-access">
          <p className="kicker">IF Access</p>
          <h1>REDEFINIR SENHA</h1>
          <p className="auth-copy">Crie uma nova senha para liberar seu acesso.</p>
          <form className="form-stack" onSubmit={handleCompletePasswordRecovery}>
            <label className="field-label" htmlFor="recovery-password">Nova senha</label>
            <input
              id="recovery-password"
              className="field-input"
              type="password"
              value={recoveryForm.password}
              onChange={(event) =>
                setRecoveryForm((current) => ({ ...current, password: event.target.value }))
              }
              placeholder="No minimo 6 caracteres"
              required
            />
            <label className="field-label" htmlFor="recovery-confirm-password">Confirmar senha</label>
            <input
              id="recovery-confirm-password"
              className="field-input"
              type="password"
              value={recoveryForm.confirmPassword}
              onChange={(event) =>
                setRecoveryForm((current) => ({ ...current, confirmPassword: event.target.value }))
              }
              placeholder="Repita a nova senha"
              required
            />
            <button className="btn-primary" type="submit" disabled={recoveryLoading}>
              {recoveryLoading ? 'ATUALIZANDO...' : 'ATUALIZAR SENHA'}
            </button>
            <button type="button" className="btn-ghost" onClick={handleCancelPasswordRecovery}>
              Voltar para acesso
            </button>
          </form>
          {recoveryMessage && <p className="status-line">{recoveryMessage}</p>}
        </section>
      </div>
    </div>
  )
}
