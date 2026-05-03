import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

function WelcomeCard() {
  return (
    <section>
      <h1>Insane Fit</h1>
      <p>Treino do dia pronto para executar.</p>
    </section>
  )
}

describe('testing library setup', () => {
  it('renderiza componente em ambiente jsdom', () => {
    render(<WelcomeCard />)

    expect(screen.getByRole('heading', { name: 'Insane Fit' })).toBeInTheDocument()
    expect(screen.getByText('Treino do dia pronto para executar.')).toBeInTheDocument()
  })
})
