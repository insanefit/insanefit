import type { Dispatch, SetStateAction } from 'react'

type NavigationHandlerDeps = {
  setActiveMenu: Dispatch<SetStateAction<string>>
  setWorkoutBuilderOpen: Dispatch<SetStateAction<boolean>>
  setWorkoutBuilderStep: Dispatch<SetStateAction<'biblioteca' | 'protocolo'>>
}

export const createNavigationHandlers = ({
  setActiveMenu,
  setWorkoutBuilderOpen,
  setWorkoutBuilderStep,
}: NavigationHandlerDeps) => {
  const handleMenuClick = (menu: string) => {
    setActiveMenu(menu)
    const isWorkoutMenu = menu === 'Treinos'
    setWorkoutBuilderOpen(isWorkoutMenu)
    if (isWorkoutMenu) {
      setWorkoutBuilderStep('biblioteca')
    }
  }

  return { handleMenuClick }
}
