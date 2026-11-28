"use client"

import { useEffect, useRef, useState } from "react"
import { Building2, ChevronRight, DoorOpen, Home, Loader2 } from "lucide-react"
import { entrarDemo } from "@/app/auth/acciones-demo"
import { limpiarDatosLocalesDemo } from "./datos-locales"

const OPCIONES = [
  {
    rol: "administrador",
    titulo: "Administrador",
    detalle: "Gastos, ingresos, casas y residentes",
    Icono: Building2,
    fondoIcono: "bg-[#fbbf24]",
  },
  {
    rol: "conserje",
    titulo: "Conserje",
    detalle: "Visitas, encomiendas y bitácora",
    Icono: DoorOpen,
    fondoIcono: "bg-[#b4d9fe]",
  },
  {
    rol: "residente",
    titulo: "Residente",
    detalle: "Mi casa, pagos y reservas",
    Icono: Home,
    fondoIcono: "bg-[#fbbf24]",
  },
] as const

export function SelectorDemo({ aviso, destacar = false }: { aviso?: string | null; destacar?: boolean }) {
  const [cargando, setCargando] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [parpadeando, setParpadeando] = useState(destacar)
  const seccionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!destacar) return
    setParpadeando(true)
    seccionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    const temporizador = window.setTimeout(() => setParpadeando(false), 4500)
    return () => window.clearTimeout(temporizador)
  }, [destacar])

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
    <section
      ref={seccionRef}
      id="demo"
      aria-labelledby="titulo-demo"
      className={`flex w-full flex-col gap-5 rounded-3xl border-2 bg-white p-6 shadow-lg sm:p-8 ${
        destacar ? "border-[#fbbf24]" : "border-[#0d3068]/10"
      }`}
    >
      <div className="flex flex-col gap-2">
        <h2
          id="titulo-demo"
          className="text-balance font-[family-name:var(--font-login-titulo)] text-2xl font-bold text-[#0d3068]"
        >
          ¡Pruébalo sin registro!
        </h2>
        <p className="text-pretty leading-relaxed text-[#0d3068]/80">
          Entra al Condominio Demo y recorre el sistema con datos de ejemplo, sin crear una cuenta. Tus cambios son
          temporales y no afectan datos reales.
        </p>
      </div>

      {aviso && (
        <p role="status" className="rounded-xl bg-[#b4d9fe]/40 p-3 text-sm text-[#0d3068]">
          {aviso}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {OPCIONES.map(({ rol, titulo, detalle, Icono, fondoIcono }) => (
          <li key={rol}>
            <button
              type="button"
              onClick={() => entrar(rol)}
              disabled={cargando !== null}
              aria-busy={cargando === rol}
              className={`group flex min-h-16 w-full items-center gap-4 rounded-2xl border-2 border-[#0d3068]/10 bg-[#fefce1]/60 p-4 text-left transition-colors hover:border-[#0d3068] hover:bg-[#fefce1] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0d3068]/30 disabled:opacity-60 ${
                parpadeando ? "demo-parpadeo border-[#fbbf24]" : ""
              }`}
            >
              <span className={`flex size-12 shrink-0 items-center justify-center rounded-full ${fondoIcono}`}>
                {cargando === rol ? (
                  <Loader2 className="size-5 animate-spin text-[#0d3068]" aria-hidden="true" />
                ) : (
                  <Icono className="size-5 text-[#0d3068]" aria-hidden="true" />
                )}
              </span>
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="font-[family-name:var(--font-login-titulo)] text-base font-semibold text-[#0d3068]">
                  {cargando === rol ? `Entrando como ${titulo}...` : titulo}
                </span>
                <span className="text-sm leading-snug text-[#0d3068]/75">{detalle}</span>
              </span>
              <ChevronRight
                className="size-5 shrink-0 text-[#0d3068]/50 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
