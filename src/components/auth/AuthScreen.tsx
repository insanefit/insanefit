import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthContext, useTrainerContext } from '../../context/appContextStore'
import { hasSupabaseCredentials } from '../../lib/supabase'

type AuthAudience = 'student' | 'trainer'
type AuthFormValues = {
  email: string
  password: string
  studentCode: string
}

export function AuthScreen() {
  const {
    authMode, setAuthMode, authForm, setAuthForm, authLoading, authMessage, setLocalAccessGranted,
    authStudentCode, setAuthStudentCode, handleAuthSubmit,
    handleResendConfirmation, handlePasswordReset,
  } = useAuthContext()
  const { setAppMode, studentPortal, setSyncMessage } = useTrainerContext()
  const [audience, setAudience] = useState<AuthAudience | null>(null)

  const isStudentAudience = audience === 'student'
  const isStudentSignup = isStudentAudience && authMode === 'signup'
  const authSchema = useMemo(
    () =>
      z
        .object({
          email: z.string().trim().email('Informe um email válido.'),
          password: z.string().trim().min(6, 'Senha deve ter no mínimo 6 caracteres.'),
          studentCode: z.string().trim(),
        })
        .superRefine((values, context) => {
          if (!isStudentSignup) return
          const code = values.studentCode.trim().toUpperCase()
          if (code.length < 6) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['studentCode'],
              message: 'Informe um código de acesso válido.',
            })
          }
        }),
    [isStudentSignup],
  )
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    mode: 'onBlur',
    defaultValues: {
      email: authForm.email,
      password: authForm.password,
      studentCode: authStudentCode,
    },
  })
  useEffect(() => {
    reset({
      email: authForm.email,
      password: authForm.password,
      studentCode: authStudentCode,
    })
  }, [authForm.email, authForm.password, authStudentCode, reset])

  const onAuthSubmit = handleSubmit(async (values) => {
    const normalizedEmail = values.email.trim().toLowerCase()
    const normalizedPassword = values.password.trim()
    const normalizedStudentCode = values.studentCode.trim().toUpperCase()

    setAuthForm({ email: normalizedEmail, password: normalizedPassword })
    if (isStudentSignup) {
      setAuthStudentCode(normalizedStudentCode)
    }

    await handleAuthSubmit(undefined, {
      email: normalizedEmail,
      password: normalizedPassword,
      studentCode: normalizedStudentCode,
    })
  })

  const submitLabel = authLoading
    ? 'PROCESSANDO...'
    : authMode === 'login'
      ? `ENTRAR COMO ${isStudentAudience ? 'ALUNO' : 'PERSONAL'}`
      : isStudentAudience
        ? 'CRIAR CONTA DE ALUNO'
        : 'CRIAR CONTA DE PERSONAL'

  const handleEnterLocalMode = () => {
    if (audience === 'student') {
      if (!studentPortal) {
        setSyncMessage('Modo aluno local indisponivel agora. Use personal e vincule um aluno.')
        return
      }
      setAppMode('student')
    } else {
      setAppMode('trainer')
    }
    setLocalAccessGranted(true)
  }

  return (
    <div className="auth-stage">
      <div className="auth-access-wrap">
        <div className="auth-brand auth-brand-top">
          <img src="/if-brand-full.png" alt="Insane Fit" className="auth-logo" />
        </div>
        <section className="auth-card auth-access">
          {!audience && (
            <>
              <p className="kicker">Insane Fit</p>
              <h1>QUEM VAI ACESSAR?</h1>
              <p className="auth-copy">Escolha o perfil para continuar.</p>
              <div className="access-role-grid">
                <button
                  type="button"
                  className="role-card"
                  onClick={() => {
                    setAudience('student')
                    setAuthMode('login')
                  }}
                >
                  <strong>ALUNO</strong>
                  <span>Treinos, series e progresso.</span>
                </button>
                <button
                  type="button"
                  className="role-card"
                  onClick={() => {
                    setAudience('trainer')
                    setAuthMode('login')
                  }}
                >
                  <strong>PERSONAL</strong>
                  <span>Alunos, treinos e agenda.</span>
                </button>
              </div>
            </>
          )}

          {audience && (
            <>
              <div className="auth-flow-head">
                <div>
                  <p className="kicker">{isStudentAudience ? 'Aluno' : 'Personal'}</p>
                  <h1>{isStudentAudience ? 'ACESSO DO ALUNO' : 'ACESSO DO PERSONAL'}</h1>
                </div>
                <button
                  type="button"
                  className="btn-ghost auth-switch-profile"
                  onClick={() => setAudience(null)}
                >
                  Voltar
                </button>
              </div>

              {hasSupabaseCredentials ? (
                <>
                  <div className="auth-tabs auth-intent-tabs">
                    <button
                      type="button"
                      className={authMode === 'login' ? 'tab active' : 'tab'}
                      onClick={() => setAuthMode('login')}
                    >
                      ENTRAR
                    </button>
                    <button
                      type="button"
                      className={authMode === 'signup' ? 'tab active' : 'tab'}
                      onClick={() => setAuthMode('signup')}
                    >
                      CRIAR CONTA
                    </button>
                  </div>

                  <form className="form-stack" onSubmit={onAuthSubmit}>
                    {isStudentSignup && (
                      <>
                        <label className="field-label" htmlFor="auth-student-code">Codigo de acesso do personal</label>
                        <input
                          id="auth-student-code"
                          className="field-input"
                          {...register('studentCode')}
                          placeholder="Ex: BLN9KQ2R"
                          maxLength={12}
                          required
                        />
                        {errors.studentCode && <p className="status-line">{errors.studentCode.message}</p>}
                        <p className="status-line">
                          Este codigo conecta sua conta ao personal automaticamente.
                        </p>
                      </>
                    )}

                    <label className="field-label" htmlFor="auth-email">Email</label>
                    <input
                      id="auth-email"
                      className="field-input"
                      type="email"
                      {...register('email')}
                      placeholder="voce@email.com"
                      required
                    />
                    {errors.email && <p className="status-line">{errors.email.message}</p>}

                    <label className="field-label" htmlFor="auth-password">Senha</label>
                    <input
                      id="auth-password"
                      className="field-input"
                      type="password"
                      {...register('password')}
                      placeholder="No minimo 6 caracteres"
                      required
                    />
                    {errors.password && <p className="status-line">{errors.password.message}</p>}

                    <button className="btn-primary" type="submit" disabled={authLoading}>
                      {submitLabel}
                    </button>

                    {authMode === 'login' && (
                      <div className="auth-help-actions">
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => handleResendConfirmation(getValues('email'))}
                          disabled={authLoading}
                        >
                          Reenviar confirmacao
                        </button>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => handlePasswordReset(getValues('email'))}
                          disabled={authLoading}
                        >
                          Esqueci minha senha
                        </button>
                      </div>
                    )}
                  </form>
                </>
              ) : (
                <div className="form-stack">
                  <p className="status-line">Modo local: acesso rapido neste dispositivo.</p>
                  {audience === 'student' && !studentPortal && (
                    <p className="status-line">Aluno local indisponivel sem portal vinculado.</p>
                  )}
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleEnterLocalMode}
                  >
                    ENTRAR NO MODO LOCAL
                  </button>
                </div>
              )}
            </>
          )}

          {authMessage && <p className="status-line">{authMessage}</p>}
        </section>
      </div>
    </div>
  )
}
