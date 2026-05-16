const CACHE_NAME = 'researchflow-v2'

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (event.request.url.includes('/api/')) return
  if (event.request.url.includes('supabase')) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone)
        })
        return response
      })
      .catch(() => {
        return caches.match(event.request).then(cached => {
          if (cached) return cached
          return new Response(
            '<html><body style="background:#05010F;color:#F3F0FF;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;flex-direction:column;gap:16px;"><div style="width:64px;height:64px;background:rgba(124,58,237,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;">📡</div><h2 style="margin:0;font-size:24px;">You are offline</h2><p style="margin:0;color:#7C6A9C;text-align:center;max-width:300px;">Connect to the internet to continue using ResearchFlow</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          )
        })
      })
  )
})
