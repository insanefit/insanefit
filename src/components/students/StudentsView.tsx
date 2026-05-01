import { useMetaContext, useTrainerContext } from '../../context/appContextStore'

export function StudentsView() {
  const {
    students,
    selectedStudentId,
    setSelectedStudentId,
    setEditingStudent,
    studentForm,
    setStudentForm,
    handleCreateStudent,
  } = useTrainerContext()
  const {
    studentCapacityText,
    studentSexOptions,
    studentTrainingLevelOptions,
    studentWorkoutTypeOptions,
    getStudentTrainingLevel,
    getStudentWorkoutType,
  } = useMetaContext()

  return (
    <article id="students" className="panel">
      <div className="panel-head">
        <h3>Alunos ativos</h3>
        <p>{studentCapacityText}</p>
      </div>

      <div className="student-grid">
        {students.map((student) => (
          <button
            key={student.id}
            type="button"
            className={student.id === selectedStudentId ? 'student-card active' : 'student-card'}
            onClick={() => {
              setSelectedStudentId(student.id)
              setEditingStudent(false)
            }}
          >
            <strong>{student.name}</strong>
            <span>{getStudentTrainingLevel(student)} • {getStudentWorkoutType(student)}</span>
          </button>
        ))}
      </div>

      <form className="form-stack" onSubmit={handleCreateStudent}>
        <h4 className="form-title">Cadastrar aluno</h4>
        <label className="field-label" htmlFor="student-name">Nome</label>
        <input
          id="student-name"
          className="field-input"
          value={studentForm.name}
          onChange={(event) =>
            setStudentForm((current) => ({ ...current, name: event.target.value }))
          }
          placeholder="Nome do aluno"
          required
        />

        <div className="split-grid">
          <div>
            <label className="field-label" htmlFor="student-sex">Sexo</label>
            <select
              id="student-sex"
              className="field-input"
              value={studentForm.sex}
              onChange={(event) =>
                setStudentForm((current) => ({ ...current, sex: event.target.value }))
              }
            >
              {studentSexOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="student-training-level">Nivel de treino</label>
            <select
              id="student-training-level"
              className="field-input"
              value={studentForm.trainingLevel}
              onChange={(event) =>
                setStudentForm((current) => ({ ...current, trainingLevel: event.target.value }))
              }
            >
              {studentTrainingLevelOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        <label className="field-label" htmlFor="student-workout-type">Tipo de treino</label>
        <select
          id="student-workout-type"
          className="field-input"
          value={studentForm.workoutType}
          onChange={(event) =>
            setStudentForm((current) => ({ ...current, workoutType: event.target.value }))
          }
        >
          {studentWorkoutTypeOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        <label className="field-label" htmlFor="student-whatsapp">WhatsApp</label>
        <input
          id="student-whatsapp"
          className="field-input"
          value={studentForm.whatsapp}
          onChange={(event) =>
            setStudentForm((current) => ({ ...current, whatsapp: event.target.value }))
          }
          placeholder="5591999999999"
        />

        <div className="split-grid">
          <div>
            <label className="field-label" htmlFor="student-monthly-fee">Mensalidade (R$)</label>
            <input
              id="student-monthly-fee"
              className="field-input"
              type="number"
              min={0}
              step={10}
              value={studentForm.monthlyFee}
              onChange={(event) =>
                setStudentForm((current) => ({ ...current, monthlyFee: event.target.value }))
              }
            />
          </div>
          <div>
            <label className="field-label" htmlFor="student-due-day">Vencimento</label>
            <input
              id="student-due-day"
              className="field-input"
              type="number"
              min={1}
              max={31}
              value={studentForm.dueDay}
              onChange={(event) =>
                setStudentForm((current) => ({ ...current, dueDay: event.target.value }))
              }
            />
          </div>
        </div>

        <label className="field-label" htmlFor="student-pix-key">Chave PIX do personal</label>
        <input
          id="student-pix-key"
          className="field-input"
          value={studentForm.pixKey}
          onChange={(event) =>
            setStudentForm((current) => ({ ...current, pixKey: event.target.value }))
          }
          placeholder="email, telefone, cpf ou chave aleatoria"
        />

        <button className="btn-secondary" type="submit">Salvar aluno</button>
      </form>
    </article>
  )
}
