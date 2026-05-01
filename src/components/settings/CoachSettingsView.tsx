import { useBillingCoachContext, useMetaContext } from '../../context/appContextStore'

export function CoachSettingsView() {
  const { coachFormInitial } = useMetaContext()
  const {
    coachForm, setCoachForm,
    handleSaveCoachProfile, handleCoachAvatarUpload,
  } = useBillingCoachContext()

  return (
    <section id="coach-profile" className="panel">
      <div className="panel-head">
        <h3>Area do personal</h3>
        <p>Defina seu nome e informacoes que aparecem no app.</p>
      </div>

      <div className="coach-grid">
        <form className="form-stack" onSubmit={handleSaveCoachProfile}>
          <div className="coach-avatar-row">
            {coachForm.avatarUrl ? (
              <img src={coachForm.avatarUrl} alt="Preview avatar" className="coach-avatar large" />
            ) : (
              <span className="coach-avatar large placeholder">{coachFormInitial}</span>
            )}
            <div className="coach-avatar-controls">
              <label className="field-label" htmlFor="coach-avatar-file">Foto do coach</label>
              <input
                id="coach-avatar-file"
                className="field-input"
                type="file"
                accept="image/*"
                onChange={handleCoachAvatarUpload}
              />
              <input
                className="field-input"
                value={coachForm.avatarUrl}
                onChange={(event) =>
                  setCoachForm((current) => ({ ...current, avatarUrl: event.target.value }))
                }
                placeholder="Ou cole URL da imagem"
              />
            </div>
          </div>

          <label className="field-label" htmlFor="coach-name">Nome no app</label>
          <input
            id="coach-name"
            className="field-input"
            value={coachForm.displayName}
            onChange={(event) =>
              setCoachForm((current) => ({ ...current, displayName: event.target.value }))
            }
            placeholder="Ex: Lucas Azevedo"
            required
          />

          <label className="field-label" htmlFor="coach-title">Titulo</label>
          <input
            id="coach-title"
            className="field-input"
            value={coachForm.title}
            onChange={(event) =>
              setCoachForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Ex: Coach de Hipertrofia"
          />

          <div className="split-grid">
            <div>
              <label className="field-label" htmlFor="coach-phone">Contato</label>
              <input
                id="coach-phone"
                className="field-input"
                value={coachForm.phone}
                onChange={(event) =>
                  setCoachForm((current) => ({ ...current, phone: event.target.value }))
                }
                placeholder="(91) 99999-9999"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="coach-instagram">Instagram</label>
              <input
                id="coach-instagram"
                className="field-input"
                value={coachForm.instagram}
                onChange={(event) =>
                  setCoachForm((current) => ({ ...current, instagram: event.target.value }))
                }
                placeholder="@seuperfil"
              />
            </div>
          </div>

          <label className="field-label" htmlFor="coach-bio">Bio curta</label>
          <input
            id="coach-bio"
            className="field-input"
            value={coachForm.bio}
            onChange={(event) =>
              setCoachForm((current) => ({ ...current, bio: event.target.value }))
            }
            placeholder="Ex: Especialista em transformacao corporal e preparacao"
          />

          <button type="submit" className="btn-primary">
            Salvar area do personal
          </button>
        </form>

        <article className="coach-preview">
          <p className="kicker">Preview</p>
          {coachForm.avatarUrl ? (
            <img src={coachForm.avatarUrl} alt="Avatar preview" className="coach-avatar large" />
          ) : (
            <span className="coach-avatar large placeholder">{coachFormInitial}</span>
          )}
          <h4>{coachForm.displayName ? `COACH ${coachForm.displayName}` : 'COACH'}</h4>
          <p>{coachForm.title || 'Personal Trainer'}</p>
          <span>{coachForm.phone || 'Contato nao informado'}</span>
          <span>{coachForm.instagram || 'Instagram nao informado'}</span>
          <small>{coachForm.bio || 'Sem bio cadastrada.'}</small>
        </article>
      </div>
    </section>
  )
}
