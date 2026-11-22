"use client"

import { useState } from "react"
import { FlaskConical, LogOut } from "lucide-react"
import { salirDemo } from "@/app/auth/acciones-demo"
import { limpiarDatosLocalesDemo } from "./datos-locales"

function horaChile(iso: string | null): string | null {
  if (!iso) return null
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return null
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha)
}

export function AvisoDemo({ rol, expira }: { rol: string; expira: string | null }) {
  const [saliendo, setSaliendo] = useState(false)
  const hasta = horaChile(expira)

  const salir = async () => {
    setSaliendo(true)
    try {
      await salirDemo()
    } finally {
      limpiarDatosLocalesDemo()
      window.location.assign("/auth/login")
    }
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 sm:px-4"
    >
      <p className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          <strong className="font-semibold">Modo demostración</strong> · {rol}
          {hasta ? ` · hasta el ${hasta}` : ""} · Datos de ejemplo; algunas acciones están limitadas
        </span>
      </p>
      <button
        type="button"
        onClick={salir}
        disabled={saliendo}
        className="flex items-center gap-1.5 rounded border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-950 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 disabled:opacity-60"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
        {saliendo ? "Saliendo..." : "Salir de la demo"}
      </button>
    </div>
  )
}
