import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from 'react'
import type { User } from '@supabase/supabase-js'
import { saveCoachProfile } from '../../services/coachStore'
import type { CoachProfile } from '../../types/coach'

type CoachHandlerDeps = {
  coachForm: CoachProfile
  currentUser: User | null
  hasSupabaseCredentials: boolean
  setSyncMessage: Dispatch<SetStateAction<string>>
  setCoachProfile: Dispatch<SetStateAction<CoachProfile>>
  setCoachForm: Dispatch<SetStateAction<CoachProfile>>
}

export const createCoachHandlers = ({
  coachForm,
  currentUser,
  hasSupabaseCredentials,
  setSyncMessage,
  setCoachProfile,
  setCoachForm,
}: CoachHandlerDeps) => {
  const handleSaveCoachProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextProfile: CoachProfile = {
      displayName: coachForm.displayName.trim(),
      title: coachForm.title.trim() || 'Personal Trainer',
      phone: coachForm.phone.trim(),
      instagram: coachForm.instagram.trim(),
      bio: coachForm.bio.trim(),
      avatarUrl: coachForm.avatarUrl.trim(),
    }

    if (!nextProfile.displayName) {
      setSyncMessage('Informe seu nome para o cabecalho do coach.')
      return
    }

    const userId = hasSupabaseCredentials ? currentUser?.id : undefined
    const saved = await saveCoachProfile(nextProfile, userId)
    if (!saved.ok) {
      setSyncMessage('Nao foi possivel salvar a area do personal agora.')
      return
    }

    setCoachProfile(nextProfile)
    setSyncMessage(
      saved.synced ? 'Area do personal atualizada e sincronizada.' : 'Area do personal atualizada.',
    )
  }

  const handleCoachAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const maxBytes = 2 * 1024 * 1024
    if (file.size > maxBytes) {
      setSyncMessage('Imagem muito grande. Use arquivo ate 2MB.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setCoachForm((current) => ({ ...current, avatarUrl: result }))
      setSyncMessage('Avatar carregado. Clique em salvar para aplicar.')
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  return { handleSaveCoachProfile, handleCoachAvatarUpload }
}
