import type { AuthChangeEvent, Session as SupabaseSession, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// ---------------------------------------------------------------------------
// Auth message mapping
// ---------------------------------------------------------------------------

const mapSupabaseAuthMessage = (rawMessage: string): string => {
  const message = rawMessage.toLowerCase()

  if (message.includes('invalid login credentials')) {
    return 'Email ou senha invalidos. Confira os dados e tente novamente.'
  }

  if (message.includes('email not confirmed')) {
    return 'Email ainda nao confirmado. Use "Reenviar confirmacao" e valide sua caixa de entrada.'
  }

  if (message.includes('user already registered')) {
    return 'Esse email ja esta cadastrado. Tente entrar ou recuperar a senha.'
  }

  if (message.includes('password should be at least 6 characters')) {
    return 'A senha precisa ter pelo menos 6 caracteres.'
  }

  if (message.includes('unable to validate email address') || message.includes('invalid email')) {
    return 'Email invalido. Revise o endereco e tente novamente.'
  }

  if (message.includes('for security purposes') || message.includes('rate limit')) {
    return 'Muitas tentativas em pouco tempo. Aguarde um minuto e tente novamente.'
  }

  if (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('load failed')
  ) {
    return 'Nao foi possivel conectar ao login agora. Limpe o cache do navegador ou tente novamente em alguns segundos.'
  }

  return rawMessage
}

const mapUnexpectedAuthError = (error: unknown): { ok: false; message: string } => {
  const message = error instanceof Error ? error.message : String(error)
  const normalized = message.toLowerCase()

  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('network') ||
    normalized.includes('timeout') ||
    normalized.includes('load failed')
  ) {
    return {
      ok: false,
      message:
        'Nao foi possivel conectar ao login agora. Limpe o cache do navegador ou tente novamente em alguns segundos.',
    }
  }

  return { ok: false, message: mapSupabaseAuthMessage(message) }
}

const withAuthTimeout = async <T,>(operation: Promise<T>, timeoutMs = 12000): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('auth timeout')), timeoutMs)
      }),
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

// ---------------------------------------------------------------------------
// Auth operations
// ---------------------------------------------------------------------------

export const getCurrentUser = async (): Promise<User | null> => {
  if (!supabase) {
    return null
  }

  try {
    const { data } = await withAuthTimeout(supabase.auth.getUser(), 8000)
    return data.user ?? null
  } catch {
    return null
  }
}

export const subscribeAuthState = (
  callback: (event: AuthChangeEvent, session: SupabaseSession | null) => void,
) => {
  if (!supabase) {
    return null
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback)

  return subscription
}

export const signIn = async (email: string, password: string): Promise<{ ok: boolean; message: string }> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase nao configurado no projeto.' }
  }

  try {
    const { error } = await withAuthTimeout(supabase.auth.signInWithPassword({ email, password }))

    if (error) {
      return { ok: false, message: mapSupabaseAuthMessage(error.message) }
    }
  } catch (error) {
    return mapUnexpectedAuthError(error)
  }

  return { ok: true, message: 'Login realizado com sucesso.' }
}

export const signUp = async (email: string, password: string): Promise<{ ok: boolean; message: string }> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase nao configurado no projeto.' }
  }

  try {
    const { data, error } = await withAuthTimeout(supabase.auth.signUp({ email, password }))

    if (error) {
      return { ok: false, message: mapSupabaseAuthMessage(error.message) }
    }

    if (!data.session) {
      return {
        ok: true,
        message:
          'Conta criada. Verifique seu email para confirmar antes de entrar.',
      }
    }
  } catch (error) {
    return mapUnexpectedAuthError(error)
  }

  return { ok: true, message: 'Conta criada e login feito com sucesso.' }
}

export const resendSignupConfirmation = async (email: string): Promise<{ ok: boolean; message: string }> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase nao configurado no projeto.' }
  }

  try {
    const { error } = await withAuthTimeout(supabase.auth.resend({
      type: 'signup',
      email,
    }))

    if (error) {
      return { ok: false, message: mapSupabaseAuthMessage(error.message) }
    }
  } catch (error) {
    return mapUnexpectedAuthError(error)
  }

  return { ok: true, message: 'Email de confirmacao reenviado. Confira caixa de entrada e spam.' }
}

export const sendPasswordReset = async (email: string): Promise<{ ok: boolean; message: string }> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase nao configurado no projeto.' }
  }

  try {
    const redirectTo = `${window.location.origin}/`
    let { error } = await withAuthTimeout(supabase.auth.resetPasswordForEmail(email, { redirectTo }))

    // Fallback para casos em que o dominio atual nao esta permitido no redirect.
    if (error && error.message.toLowerCase().includes('redirect')) {
      const fallback = await withAuthTimeout(supabase.auth.resetPasswordForEmail(email))
      error = fallback.error
    }

    if (error) {
      return { ok: false, message: mapSupabaseAuthMessage(error.message) }
    }
  } catch (error) {
    return mapUnexpectedAuthError(error)
  }

  return { ok: true, message: 'Link de recuperacao enviado para seu email.' }
}

export const updateUserPassword = async (password: string): Promise<{ ok: boolean; message: string }> => {
  if (!supabase) {
    return { ok: false, message: 'Supabase nao configurado no projeto.' }
  }

  try {
    const { error } = await withAuthTimeout(supabase.auth.updateUser({ password }))

    if (error) {
      return { ok: false, message: mapSupabaseAuthMessage(error.message) }
    }
  } catch (error) {
    return mapUnexpectedAuthError(error)
  }

  return { ok: true, message: 'Senha redefinida com sucesso.' }
}

export const signOut = async (): Promise<void> => {
  if (!supabase) {
    return
  }

  await supabase.auth.signOut()
}
