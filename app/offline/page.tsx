"use client"

import { WifiOff, RefreshCw } from "lucide-react"

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d3068] to-[#1a4a8f] p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-24 h-24 mx-auto bg-white/10 rounded-full flex items-center justify-center">
          <WifiOff className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Sin conexión</h1>
        <p className="text-white/80">
          Parece que no tienes conexión a internet. Verifica tu conexión e intenta de nuevo.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#fefce1] text-[#0d3068] rounded-full font-semibold hover:bg-white transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Reintentar
        </button>
      </div>
    </div>
  )
}
