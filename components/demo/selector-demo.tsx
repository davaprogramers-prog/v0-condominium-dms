"use client"

import { useState } from "react"
import { Building2, DoorOpen, Home, Loader2 } from "lucide-react"
import { entrarDemo } from "@/app/auth/acciones-demo"
import { limpiarDatosLocalesDemo } from "./datos-locales"

const OPCIONES = [
  {
    rol: "administrador",
    titulo: "Administrador",
    detalle: "Gastos, ingresos, casas y residentes",
    Icono: Building2,
  },
  {
    rol: "conserje",
    titulo: "Conserje",
    detalle: "Visitas, encomiendas y bitácora",
    Icono: DoorOpen,
  },
  {
    rol: "residente",
    titulo: "Residente",
    detalle: "Mi casa, pagos y reservas",
    Icono: Home,
  },
] as const

export function SelectorDemo({ aviso }: { aviso?: string | null }) {
  const [cargando, setCargando] = useState<string | null>(null)
  const [error, setError] = useState("")

  const entrar = async (rol: string) => {
    setError("")
    setCargando(rol)
    try {
      const resultado = await entrarDemo(rol)
      if (!resultado.ok) {
        setError(resultado.error)
        return
      }
      limpiarDatosLocalesDemo()
      window.location.assign(resultado.destino)
    } catch {
      setError("La demostración no está disponible en este momento. Intenta más tarde.")
    } finally {
      setCargando(null)
    }
  }

  return (
    <section aria-labelledby="titulo-demo" className="flex w-full max-w-md flex-col gap-3 rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 id="titulo-demo" className="text-sm font-semibold text-gray-900">
          Prueba la demostración
        </h2>
        <p className="text-pretty text-sm leading-relaxed text-gray-600">
          Entra a un condominio de ejemplo sin crear cuenta. Tus cambios son temporales y no afectan datos reales.
        </p>
      </div>

      {aviso && (
        <p role="status" className="rounded bg-gray-100 p-3 text-sm text-gray-800">
          {aviso}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {OPCIONES.map(({ rol, titulo, detalle, Icono }) => (
          <button
            key={rol}
            type="button"
            onClick={() => entrar(rol)}
            disabled={cargando !== null}
            aria-busy={cargando === rol}
            className="flex items-center gap-3 rounded-md border border-gray-200 p-3 text-left transition-colors hover:border-blue-600 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-60 sm:flex-col sm:items-start sm:gap-2"
          >
            {cargando === rol ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-blue-600" aria-hidden="true" />
            ) : (
              <Icono className="h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
            )}
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-gray-900">{titulo}</span>
              <span className="text-xs leading-snug text-gray-600">{detalle}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
