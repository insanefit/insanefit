import { useMetaContext, useTrainerContext } from '../../context/appContextStore'

export function StudentDetail() {
  const {
    selectedStudent,
    editingStudent,
    studentEditForm,
    setStudentEditForm,
    handleStartStudentEdit,
    handleCancelStudentEdit,
    handleUpdateStudent,
    handleMenuClick,
    handleCopyStudentCode,
    handleShareStudentAccessLink,
    handleUnlinkStudentAccess,
    handleDeleteStudent,
  } = useTrainerContext()
  const {
    selectedStudentHistoryPreview,
    studentSexOptions,
    studentTrainingLevelOptions,
    studentWorkoutTypeOptions,
    getStudentSex,
    getStudentTrainingLevel,
    getStudentWorkoutType,
  } = useMetaContext()

  const computeAccessStatus = () => {
    if (!selectedStudent?.accessEndDate) {
      return { label: 'Sem validade definida', hint: 'Defina a validade no cadastro do aluno.', expired: false }
    }
    const endDate = new Date(`${selectedStudent.accessEndDate}T23:59:59`)
    if (Number.isNaN(endDate.getTime())) {
      return { label: 'Validade inválida', hint: 'Revise a data de validade.', expired: false }
    }
    const now = new Date()
    const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) {
      return { label: 'Expirado', hint: `Expirou há ${Math.abs(diffDays)} dia(s).`, expired: true }
    }
    if (diffDays === 0) {
      return { label: 'Vence hoje', hint: 'Renove para evitar bloqueio do aluno.', expired: false }
    }
    return { label: 'Ativo', hint: `Vence em ${diffDays} dia(s).`, expired: false }
  }

  const accessStatus = computeAccessStatus()

  return (
    <section className="panel">
      <div className="panel-head">
        <h3>{selectedStudent?.name ?? 'Sem aluno selecionado'}</h3>
        <p>
          {selectedStudent
            ? `${getStudentTrainingLevel(selectedStudent)} • ${getStudentWorkoutType(selectedStudent)}`
            : 'Cadastre um aluno para iniciar'}
        </p>
        {selectedStudent && (
          <div className="student-access-actions">
            <button type="button" className="btn-secondary" onClick={handleStartStudentEdit}>
              Editar aluno
            </button>
            <button type="button" className="btn-secondary" onClick={() => handleMenuClick('Treinos')}>
              Abrir treinos
            </button>
          </div>
        )}
      </div>

      {selectedStudent && (
        <div className="student-detail-grid">
          <div className="detail-block">
            <span>Sexo</span>
            <strong>{getStudentSex(selectedStudent)}</strong>
          </div>
          <div className="detail-block">
            <span>Tipo de treino</span>
            <strong>{getStudentWorkoutType(selectedStudent)}</strong>
          </div>
          <div className="detail-block">
            <span>Nivel de treino</span>
            <strong>{getStudentTrainingLevel(selectedStudent)}</strong>
          </div>
          <div className="detail-block">
            <span>Codigo do aluno</span>
            <strong>{selectedStudent.shareCode ?? 'Nao definido'}</strong>
          </div>
          <div className="detail-block">
            <span>Status de acesso</span>
            <strong>{selectedStudent.studentUserId ? 'Conta vinculada' : 'Aguardando vinculacao'}</strong>
          </div>
          <div className="detail-block">
            <span>WhatsApp</span>
            <strong>{selectedStudent.whatsapp ?? 'Nao informado'}</strong>
          </div>
          <div className="detail-block">
            <span>Início da validade</span>
            <strong>{selectedStudent.accessStartDate ?? 'Não definido'}</strong>
          </div>
          <div className="detail-block">
            <span>Fim da validade</span>
            <strong>{selectedStudent.accessEndDate ?? 'Não definido'}</strong>
          </div>
          <div className="detail-block full">
            <span>Status da validade</span>
            <strong>
              {accessStatus.label} {accessStatus.expired ? '🔒' : '✅'}
            </strong>
            <small>{accessStatus.hint}</small>
          </div>
          {editingStudent && (
            <div className="detail-block full">
              <form className="form-stack" onSubmit={handleUpdateStudent}>
                <h4 className="form-title">Editar aluno</h4>
                <label className="field-label" htmlFor="edit-student-name">Nome</label>
                <input
                  id="edit-student-name"
                  className="field-input"
                  value={studentEditForm.name}
                  onChange={(event) =>
                    setStudentEditForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
                <div className="split-grid">
                  <div>
                    <label className="field-label" htmlFor="edit-student-sex">Sexo</label>
                    <select
                      id="edit-student-sex"
                      className="field-input"
                      value={studentEditForm.sex}
                      onChange={(event) =>
                        setStudentEditForm((current) => ({ ...current, sex: event.target.value }))
                      }
                    >
                      {studentSexOptions.map((option) => (
                        <option key={`edit-sex-${option}`} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="edit-student-level">Nivel de treino</label>
                    <select
                      id="edit-student-level"
                      className="field-input"
                      value={studentEditForm.trainingLevel}
                      onChange={(event) =>
                        setStudentEditForm((current) => ({ ...current, trainingLevel: event.target.value }))
                      }
                    >
                      {studentTrainingLevelOptions.map((option) => (
                        <option key={`edit-level-${option}`} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <label className="field-label" htmlFor="edit-student-workout-type">Tipo de treino</label>
                <select
                  id="edit-student-workout-type"
                  className="field-input"
                  value={studentEditForm.workoutType}
                  onChange={(event) =>
                    setStudentEditForm((current) => ({ ...current, workoutType: event.target.value }))
                  }
                >
                  {studentWorkoutTypeOptions.map((option) => (
                    <option key={`edit-workout-${option}`} value={option}>{option}</option>
                  ))}
                </select>
                <label className="field-label" htmlFor="edit-student-whatsapp">WhatsApp</label>
                <input
                  id="edit-student-whatsapp"
                  className="field-input"
                  value={studentEditForm.whatsapp}
                  onChange={(event) =>
                    setStudentEditForm((current) => ({ ...current, whatsapp: event.target.value }))
                  }
                  placeholder="5591999999999"
                />
                <label className="field-label" htmlFor="edit-student-validity-days">Validade do acesso (dias)</label>
                <input
                  id="edit-student-validity-days"
                  className="field-input"
                  type="number"
                  min={1}
                  max={3650}
                  value={studentEditForm.validityDays}
                  onChange={(event) =>
                    setStudentEditForm((current) => ({ ...current, validityDays: event.target.value }))
                  }
                  placeholder="30"
                />
                <div className="student-access-actions">
                  <button type="submit" className="btn-secondary">Salvar alteracoes</button>
                  <button type="button" className="btn-ghost" onClick={handleCancelStudentEdit}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
          <div className="detail-block full">
            <div className="student-access-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { void handleCopyStudentCode(selectedStudent.shareCode) }}
              >
                Copiar codigo
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { void handleShareStudentAccessLink(selectedStudent) }}
              >
                Enviar link de acesso
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => { void handleUnlinkStudentAccess(selectedStudent.id) }}
                disabled={!selectedStudent.studentUserId}
              >
                Desvincular aluno
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => { void handleDeleteStudent() }}
              >
                Excluir aluno
              </button>
            </div>
          </div>
          <div className="detail-block full">
            <div className="progress-head">
              <span>Adesao</span>
              <strong>{selectedStudent.adherence}%</strong>
            </div>
            <div className="progress-track">
              <span className="progress-fill" style={{ width: `${selectedStudent.adherence}%` }} />
            </div>
          </div>
          <div className="detail-block full history-chart-card">
            <div className="progress-head">
              <span>Historico visual</span>
              <strong>{selectedStudentHistoryPreview.length} registros</strong>
            </div>
            {selectedStudentHistoryPreview.length === 0 ? (
              <p className="empty-line">Sem registros ainda. Marque aulas concluidas para gerar o grafico.</p>
            ) : (
              <div className="history-chart-list">
                {selectedStudentHistoryPreview.map((entry) => {
                  const label = new Date(entry.date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                  })
                  const deltaLabel = entry.delta > 0 ? `+${entry.delta}` : `${entry.delta}`
                  return (
                    <div key={entry.id} className="history-chart-row">
                      <span>{label}</span>
                      <div className="history-chart-track">
                        <span
                          className="history-chart-fill"
                          style={{ width: `${Math.max(4, entry.score)}%` }}
                        />
                      </div>
                      <strong>{entry.score}% ({deltaLabel})</strong>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
