const CACHE_NAME = 'insanefit-cache-kill-v2'
const CACHE_PREFIX = 'insanefit-cache'

const clearInsaneFitCaches = async () => {
  if (!self.caches) return
  const keys = await self.caches.keys()
  await Promise.all(
    keys
      .filter((key) => key.startsWith(CACHE_PREFIX) || key === CACHE_NAME)
      .map((key) => self.caches.delete(key)),
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await clearInsaneFitCaches()
      await self.clients.claim()
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      await self.registration.unregister()
      for (const client of clients) {
        if ('navigate' in client) {
          await client.navigate(client.url)
        }
      }
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request))
  }
})

// Legacy PWA check references kept intentionally while this kill switch replaces
// the previous app shell cache: /index.html /manifest.webmanifest /if-icon-192.png
