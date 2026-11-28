import Image from "next/image"
import { BarChart3, CalendarCheck, Package, Wallet } from "lucide-react"

const VENTAJAS = [
  { Icono: Wallet, texto: "Gastos comunes y deudas por casa, siempre al día" },
  { Icono: BarChart3, texto: "Balance y reportes listos, sin armar planillas" },
  { Icono: CalendarCheck, texto: "Reservas de quincho, sala multiuso y áreas comunes" },
  { Icono: Package, texto: "Visitas y encomiendas registradas en conserjería" },
]

function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <div className={`flex flex-col ${compacta ? "items-center gap-3 text-center" : "gap-5"}`}>
      <div className={`flex ${compacta ? "justify-center" : ""}`}>
        <div className="rounded-2xl bg-white px-4 py-3 shadow-lg">
          <img
            src="/intelicon-logo.png"
            alt="InteliCON"
            className={compacta ? "h-10 w-auto object-contain" : "h-14 w-auto object-contain"}
          />
        </div>
      </div>
      <p className="text-xs font-semibold tracking-widest text-[#fbbf24]">ADMINISTRACIÓN DE CONDOMINIOS</p>
      <div className={`flex flex-col gap-3 ${compacta ? "items-center" : ""}`}>
        <h1
          className={`text-balance font-[family-name:var(--font-login-titulo)] font-bold leading-tight text-[#fefce1] ${
            compacta ? "text-2xl" : "text-4xl 2xl:text-5xl"
          }`}
        >
          Tu condominio, en orden y en un solo lugar
        </h1>
        <span aria-hidden="true" className="h-1 w-20 rounded-full bg-[#fbbf24]" />
      </div>
      <p className={`text-pretty leading-relaxed text-[#fefce1]/90 ${compacta ? "text-sm" : "text-lg"}`}>
        Cuentas claras para la administración. Tranquilidad para los vecinos.
      </p>
    </div>
  )
}

export function CabeceraMarcaMovil() {
  return (
    <header className="bg-[#0d3068] px-5 pb-8 pt-6 lg:hidden">
      <Marca compacta />
    </header>
  )
}

export function PanelMarcaEscritorio() {
  return (
    <aside className="hidden bg-[#0d3068] lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between lg:gap-8 lg:overflow-y-auto lg:px-12 lg:py-12 xl:px-16">
      <div className="flex flex-col gap-8">
        <Marca />
        <ul className="flex flex-col gap-4">
          {VENTAJAS.map(({ Icono, texto }) => (
            <li key={texto} className="flex items-center gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#b4d9fe]">
                <Icono className="size-5 text-[#0d3068]" aria-hidden="true" />
              </span>
              <span className="text-base leading-snug text-[#fefce1]">{texto}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative min-h-52 w-full flex-1 overflow-hidden rounded-3xl border-4 border-[#fefce1]/15">
        <Image
          src="/login/condominio-ilustracion.png"
          alt="Ilustración de un condominio con un celular y un notebook mostrando el panel de InteliCON"
          fill
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="scale-[1.17] object-cover object-[center_65%]"
          priority
        />
      </div>
    </aside>
  )
}
