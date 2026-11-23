'use client'

import { useEffect } from 'react'

export function RegistrarServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    // Dentro de un iframe (vista previa) el registro no aplica y puede interferir.
    if (window.self !== window.top) return
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('[pwa] no se pudo registrar el service worker:', (err as Error).message)
    })
  }, [])
  return null
}
