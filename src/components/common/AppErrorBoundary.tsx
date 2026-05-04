import { Component, type ReactNode } from 'react'

type AppErrorBoundaryProps = {
  children: ReactNode
}

type AppErrorBoundaryState = {
  hasError: boolean
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('App runtime error:', error)
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '24px',
          background: 'linear-gradient(160deg, #07090f, #10182a)',
          color: '#f1f5f9',
        }}
      >
        <section
          style={{
            width: 'min(520px, 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(248, 250, 252, 0.15)',
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '24px',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '1.4rem', letterSpacing: '0.03em' }}>Algo saiu do controle</h1>
          <p style={{ marginTop: '12px', lineHeight: 1.5, color: '#cbd5e1' }}>
            O app encontrou um erro inesperado. Seus dados locais permanecem salvos. Recarregue para continuar.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              marginTop: '10px',
              border: 'none',
              borderRadius: '10px',
              background: '#ef233c',
              color: '#fff',
              fontWeight: 700,
              padding: '10px 16px',
              cursor: 'pointer',
            }}
          >
            Recarregar app
          </button>
        </section>
      </main>
    )
  }
}

