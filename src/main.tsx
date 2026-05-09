import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { queryClient } from './lib/queryClient.ts'
import { AppErrorBoundary } from './components/common/AppErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </AppErrorBoundary>
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void (async () => {
      try {
        // Hotfix: remove stale PWA caches that can pin an old UI build in production.
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map((registration) => registration.unregister()))
        if ('caches' in window) {
          const keys = await window.caches.keys()
          await Promise.all(
            keys
              .filter((key) => key.startsWith('insanefit-cache'))
              .map((key) => window.caches.delete(key)),
          )
        }
      } catch {
        // ignore cleanup errors
      }
    })()
  })
}
