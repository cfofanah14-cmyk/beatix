'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[Beatix SW] Registered, scope:', reg.scope)

          // Check for updates every 60 seconds
          setInterval(() => reg.update(), 60_000)

          // Notify user when new version available
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (!newWorker) return
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[Beatix SW] New version available')
                // Optionally: show a toast prompting user to refresh
              }
            })
          })
        })
        .catch((err) => {
          console.warn('[Beatix SW] Registration failed:', err)
        })
    })
  }, [])

  return null
}
