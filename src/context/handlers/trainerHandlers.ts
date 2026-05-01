import type { Dispatch, SetStateAction } from 'react'
import type { User } from '@supabase/supabase-js'
import { clampToPercent } from '../../utils/progressUtils'
import type { StudentPortalData, TrainerData, Session, Student } from '../../types/trainer'
import type { ProgressHistoryEntry } from '../../types/workout'
import { syncStudentProgressAtomicallyRemotely } from '../../services/trainerStore'

type TrainerHandlerDeps = {
  sessions: Session[]
  doneSessions: string[]
  students: Student[]
  currentUser: User | null
  hasSupabaseCredentials: boolean
  setDoneSessions: Dispatch<SetStateAction<string[]>>
  setTrainerData: Dispatch<SetStateAction<TrainerData>>
  setStudentPortal: Dispatch<SetStateAction<StudentPortalData | null>>
  setProgressHistory: Dispatch<SetStateAction<Record<string, ProgressHistoryEntry[]>>>
  setSyncMessage: Dispatch<SetStateAction<string>>
  createId: (prefix: string) => string
}

export const createTrainerHandlers = ({
  sessions,
  doneSessions,
  students,
  currentUser,
  hasSupabaseCredentials,
  setDoneSessions,
  setTrainerData,
  setStudentPortal,
  setProgressHistory,
  setSyncMessage,
  createId,
}: TrainerHandlerDeps) => {
  const toggleSession = (sessionId: string) => {
    const targetSession = sessions.find((session) => session.id === sessionId)
    if (!targetSession) return

    const alreadyDone = doneSessions.includes(sessionId)
    const isCompleting = !alreadyDone
    const targetStudent = students.find((student) => student.id === targetSession.studentId)
    const adherenceDelta = isCompleting ? 2 : -2

    setDoneSessions((current) =>
      alreadyDone ? current.filter((id) => id !== sessionId) : [...current, sessionId],
    )

    setTrainerData((current) => ({
      ...current,
      students: current.students.map((student) => {
        if (student.id !== targetSession.studentId) return student
        const nextAdherence = clampToPercent(student.adherence + adherenceDelta)
        const nextStreak = Math.max(0, student.streak + (isCompleting ? 1 : -1))
        return { ...student, adherence: nextAdherence, streak: nextStreak }
      }),
    }))

    setStudentPortal((current) => {
      if (!current || current.student.id !== targetSession.studentId) return current
      return {
        ...current,
        student: {
          ...current.student,
          adherence: clampToPercent(current.student.adherence + adherenceDelta),
          streak: Math.max(0, current.student.streak + (isCompleting ? 1 : -1)),
        },
      }
    })

    if (targetStudent) {
      const nextAdherence = clampToPercent(targetStudent.adherence + adherenceDelta)
      const historyEntry: ProgressHistoryEntry = {
        id: createId('p'),
        date: new Date().toISOString(),
        score: nextAdherence,
        delta: adherenceDelta,
      }

      setProgressHistory((current) => ({
        ...current,
        [targetStudent.id]: [...(current[targetStudent.id] ?? []), historyEntry].slice(-30),
      }))

      setSyncMessage(
        isCompleting
          ? `Treino concluido. +2% de progresso semanal para ${targetStudent.name}.`
          : `Marcacao removida para ${targetStudent.name}. Ajuste de -2% no progresso.`,
      )
    }

    if (hasSupabaseCredentials && currentUser) {
      void syncStudentProgressAtomicallyRemotely({
        studentId: targetSession.studentId,
        sessionId,
        adherenceDelta,
        streakDelta: isCompleting ? 1 : -1,
        isCompleting,
        userId: currentUser.id,
      }).then((remoteResult) => {
        if (!remoteResult.ok || remoteResult.nextAdherence === undefined || remoteResult.nextStreak === undefined) {
          return
        }

        const nextAdherence = remoteResult.nextAdherence
        const nextStreak = remoteResult.nextStreak

        setTrainerData((current) => ({
          ...current,
          students: current.students.map((student) =>
            student.id === targetSession.studentId
              ? { ...student, adherence: nextAdherence, streak: nextStreak }
              : student,
          ),
        }))

        setStudentPortal((current) => {
          if (!current || current.student.id !== targetSession.studentId) return current
          return {
            ...current,
            student: {
              ...current.student,
              adherence: nextAdherence,
              streak: nextStreak,
            },
          }
        })
      })
    }
  }

  return { toggleSession }
}
