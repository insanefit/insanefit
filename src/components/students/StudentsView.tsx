import { useMetaContext, useTrainerContext } from '../../context/appContextStore'

export function StudentsView() {
  const {
    students,
    selectedStudentId,
    setSelectedStudentId,
    setEditingStudent,
    handleMenuClick,
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
        {students.map((student) => {
          const selectStudent = () => {
            setSelectedStudentId(student.id)
            setEditingStudent(false)
          }

          const openStudentWorkout = () => {
            selectStudent()
            handleMenuClick('Treinos')
          }

          return (
            <div
              key={student.id}
              className={student.id === selectedStudentId ? 'student-card active' : 'student-card'}
            >
              <button
                type="button"
                className="student-card-name-link"
                onClick={openStudentWorkout}
              >
                {student.name}
              </button>
              <span>{getStudentTrainingLevel(student)} • {getStudentWorkoutType(student)}</span>
              <div className="student-card-actions">
                <button type="button" className="student-card-action" onClick={selectStudent}>
                  Ver aluno
                </button>
                <button type="button" className="student-card-action student-card-action-primary" onClick={openStudentWorkout}>
                  Abrir treino
                </button>
              </div>
            </div>
          )
        })}
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

        <label className="field-label" htmlFor="student-validity-days">Validade do acesso (dias)</label>
        <input
          id="student-validity-days"
          className="field-input"
          type="number"
          min={1}
          max={3650}
          value={studentForm.validityDays}
          onChange={(event) =>
            setStudentForm((current) => ({ ...current, validityDays: event.target.value }))
          }
          placeholder="30"
        />

        <button className="btn-secondary" type="submit">Salvar aluno</button>
      </form>
    </article>
  )
}
