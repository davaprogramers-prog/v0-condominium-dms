'use client'

import { useCallback, useEffect, useState } from 'react'

export type Plataforma = 'android' | 'ios' | 'escritorio'

interface EventoInstalacion extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function detectarPlataforma(userAgent: string, toquesMaximos: number): Plataforma {
  if (/android/i.test(userAgent)) return 'android'
  // iPadOS 13+ se presenta como Macintosh, pero tiene pantalla táctil.
  if (/iphone|ipad|ipod/i.test(userAgent) || (/macintosh/i.test(userAgent) && toquesMaximos > 1)) return 'ios'
  return 'escritorio'
}

export function useInstalacionPwa() {
  const [eventoInstalacion, setEventoInstalacion] = useState<EventoInstalacion | null>(null)
  const [plataforma, setPlataforma] = useState<Plataforma>('escritorio')
  const [instalada, setInstalada] = useState(false)

  useEffect(() => {
    setPlataforma(detectarPlataforma(navigator.userAgent, navigator.maxTouchPoints ?? 0))
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    setInstalada(standalone)

    const alOfrecer = (e: Event) => {
      e.preventDefault()
      setEventoInstalacion(e as EventoInstalacion)
    }
    const alInstalar = () => {
      setInstalada(true)
      setEventoInstalacion(null)
    }
    window.addEventListener('beforeinstallprompt', alOfrecer)
    window.addEventListener('appinstalled', alInstalar)
    return () => {
      window.removeEventListener('beforeinstallprompt', alOfrecer)
      window.removeEventListener('appinstalled', alInstalar)
    }
  }, [])

  const instalar = useCallback(async () => {
    if (!eventoInstalacion) return false
    await eventoInstalacion.prompt()
    const { outcome } = await eventoInstalacion.userChoice
    setEventoInstalacion(null)
    return outcome === 'accepted'
  }, [eventoInstalacion])

  return { plataforma, instalada, puedeInstalarDirecto: eventoInstalacion !== null, instalar }
}
