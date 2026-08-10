// Beatix Service Worker — Offline support & caching
const CACHE_VERSION = 'beatix-v1'
const STATIC_CACHE  = `${CACHE_VERSION}-static`
const API_CACHE     = `${CACHE_VERSION}-api`

// Pages and assets to pre-cache at install time
const PRECACHE_URLS = [
  '/',
  '/explore',
  '/my-tickets',
  '/help',
  '/offline',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json',
]

// ── Install — pre-cache core assets ──────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        // Don't fail install if some URLs aren't available yet
        console.warn('[SW] Pre-cache partial failure:', err)
      })
    })
  )
  self.skipWaiting()
})

// ── Activate — clean up old caches ───────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('beatix-') && key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch — cache strategies ──────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and browser-extension requests
  if (request.method !== 'GET') return
  if (!url.protocol.startsWith('http')) return

  // API requests — network first, fall back to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(request, API_CACHE))
    return
  }

  // Static assets (_next/static) — cache first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE))
    return
  }

  // HTML pages — network first, fall back to cached page or /offline
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstHtml(request))
    return
  }

  // Everything else — stale while revalidate
  event.respondWith(staleWhileRevalidate(request, STATIC_CACHE))
})

// ── Strategy: Network first, cache fallback ──────────────────
async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// ── Strategy: Cache first, network fallback ──────────────────
async function cacheFirstWithNetwork(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

// ── Strategy: Network first for HTML pages ───────────────────
async function networkFirstHtml(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    const offline = await caches.match('/offline')
    return offline || new Response('<h1>You are offline</h1>', {
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

// ── Strategy: Stale while revalidate ────────────────────────
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone())
    return response
  }).catch(() => null)

  return cached || fetchPromise
}

// ── Push notifications (future use) ──────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'Beatix', {
      body:  data.body  || 'You have a new notification',
      icon:  '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data:  data.url ? { url: data.url } : {},
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})
