import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AppErrorBoundary } from './AppErrorBoundary'

function CrashComponent() {
  throw new Error('boom')
  return null
}

describe('AppErrorBoundary', () => {
  it('mostra fallback quando ocorre erro em runtime', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <AppErrorBoundary>
        <CrashComponent />
      </AppErrorBoundary>,
    )

    expect(screen.getByText('Algo saiu do controle')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recarregar app' })).toBeInTheDocument()
    errorSpy.mockRestore()
  })
})
