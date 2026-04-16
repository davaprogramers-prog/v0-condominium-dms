"use client"

import { useEffect, useState, createContext, useContext, useCallback } from "react"
import { X, Download, RefreshCw, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PWAContextType {
  isInstallable: boolean
  isInstalled: boolean
  isUpdateAvailable: boolean
  installApp: () => Promise<void>
  updateApp: () => void
}

const PWAContext = createContext<PWAContextType>({
  isInstallable: false,
  isInstalled: false,
  isUpdateAvailable: false,
  installApp: async () => {},
  updateApp: () => {},
})

export const usePWA = () => useContext(PWAContext)

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Wait for client-side hydration before checking PWA state
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Only run on client after hydration
    if (!isClient) return
    
    // Verificar si ya está instalada como PWA
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    const isIOSStandalone = (window.navigator as any).standalone === true
    setIsInstalled(isStandalone || isIOSStandalone)

    // Registrar Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registrado")
          setRegistration(reg)

          // Verificar actualizaciones cada 60 segundos
          setInterval(() => {
            reg.update()
          }, 60000)

          // Escuchar actualizaciones
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("[PWA] Nueva versión disponible")
                  setIsUpdateAvailable(true)
                  setShowUpdateBanner(true)
                }
              })
            }
          })
        })
        .catch((err) => console.error("[PWA] Error registrando SW:", err))

      // Escuchar mensajes del SW
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "SW_UPDATED") {
          window.location.reload()
        }
      })
    }

    // Escuchar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
      
      // Mostrar banner después de 3 segundos si no está instalada
      const dismissed = localStorage.getItem("pwa-install-dismissed")
      if (!dismissed) {
        setTimeout(() => setShowInstallBanner(true), 3000)
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Detectar cuando se instala
    window.addEventListener("appinstalled", () => {
      console.log("[PWA] App instalada")
      setIsInstalled(true)
      setIsInstallable(false)
      setShowInstallBanner(false)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [isClient])

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === "accepted") {
        console.log("[PWA] Usuario aceptó la instalación")
      } else {
        console.log("[PWA] Usuario rechazó la instalación")
        localStorage.setItem("pwa-install-dismissed", "true")
      }
    } catch (error) {
      console.error("[PWA] Error al instalar:", error)
    }
    
    setDeferredPrompt(null)
    setShowInstallBanner(false)
  }, [deferredPrompt])

  const updateApp = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" })
    }
    setShowUpdateBanner(false)
  }, [registration])

  const dismissInstallBanner = () => {
    setShowInstallBanner(false)
    localStorage.setItem("pwa-install-dismissed", "true")
  }

  return (
    <PWAContext.Provider value={{ isInstallable, isInstalled, isUpdateAvailable, installApp, updateApp }}>
      {children}

      {/* Banner de instalación */}
      {showInstallBanner && !isInstalled && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100] animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#0d3068] text-white rounded-2xl shadow-2xl p-4 border border-white/10">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-[#fefce1] rounded-xl flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6 text-[#0d3068]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg">Instalar InteliCon</h3>
                <p className="text-white/70 text-sm mt-1">
                  Instala la app para acceso rápido y notificaciones
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={installApp}
                    className="bg-[#fefce1] text-[#0d3068] hover:bg-white"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Instalar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={dismissInstallBanner}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    Ahora no
                  </Button>
                </div>
              </div>
              <button
                onClick={dismissInstallBanner}
                className="text-white/50 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner de actualización */}
      {showUpdateBanner && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100] animate-in slide-in-from-top-5 duration-300">
          <div className="bg-emerald-600 text-white rounded-2xl shadow-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">Nueva versión disponible</h3>
                <p className="text-white/80 text-sm mt-1">
                  Actualiza para obtener las últimas mejoras
                </p>
                <Button
                  size="sm"
                  onClick={updateApp}
                  className="mt-3 bg-white text-emerald-600 hover:bg-emerald-50"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Actualizar ahora
                </Button>
              </div>
              <button
                onClick={() => setShowUpdateBanner(false)}
                className="text-white/50 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </PWAContext.Provider>
  )
}
