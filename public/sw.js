const CACHE_NAME = 'researchflow-v3'

const NEVER_CACHE = [
  'supabase',
  'auth',
  '/api/',
  'token',
  'oauth',
  'callback',
  'googleapis',
  'twilio',
  'accounts.google',
]

const STATIC_ASSETS = [
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }).catch(() => {})
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
  const url = event.request.url

  // NEVER intercept these - let them go directly to network always
  const shouldSkip = NEVER_CACHE.some(pattern => url.includes(pattern))

  if (shouldSkip) return
  if (event.request.method !== 'GET') return

  // For everything else: network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses
        if (response.ok && response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, clone)
            })
            .catch(() => {})
        }
        return response
      })
      .catch(() => {
        // Network failed - try cache
        return caches.match(event.request)
          .then(cached => {
            if (cached) return cached
            // Only show offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return new Response(
                `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>ResearchFlow - Offline</title>
  <style>
    body {
      background: #05010F;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      font-family: sans-serif;
      text-align: center;
    }
    h2 { color: #A855F7; }
    p { color: #7C6A9C; }
    button {
      margin-top: 16px;
      padding: 10px 24px;
      background: #7C3AED;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div>
    <h2>You are offline</h2>
    <p>Connect to the internet to use ResearchFlow</p>
    <button onclick="location.reload()">Try Again</button>
  </div>
</body>
</html>`,
                { headers: { 'Content-Type': 'text/html' } }
              )
            }
          })
          .catch(() => {})
      })
  )
})
