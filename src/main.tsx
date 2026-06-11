import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { queryClient } from './lib/queryClient.ts'
import { AppErrorBoundary } from './components/common/AppErrorBoundary.tsx'

const clearBrowserAppCache = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.unregister()))
  }

  if ('caches' in window) {
    const keys = await window.caches.keys()
    await Promise.all(keys.map((key) => window.caches.delete(key)))
  }
}

const shouldResetCache = new URLSearchParams(window.location.search).get('reset') === 'cache'

if (shouldResetCache) {
  void (async () => {
    try {
      await clearBrowserAppCache()
    } finally {
      window.location.replace(window.location.origin + window.location.pathname)
    }
  })()
}

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
        await clearBrowserAppCache()
      } catch {
        // ignore cleanup errors
      }
    })()
  })
}
