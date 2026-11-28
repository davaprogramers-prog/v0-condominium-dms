import { BarChart3, CalendarCheck, Package, Wallet } from "lucide-react"

const VENTAJAS = [
  { Icono: Wallet, texto: "Gastos comunes y deudas por casa, siempre al día" },
  { Icono: BarChart3, texto: "Balance y reportes listos, sin armar planillas" },
  { Icono: CalendarCheck, texto: "Reservas de quincho, sala multiuso y áreas comunes" },
  { Icono: Package, texto: "Visitas y encomiendas registradas en conserjería" },
]

function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <div className={`flex flex-col ${compacta ? "items-center gap-3 text-center" : "gap-4"}`}>
      <div className={`flex ${compacta ? "justify-center" : ""}`}>
        <div className="rounded-2xl bg-white px-4 py-2.5 shadow-lg">
          <img src="/intelicon-logo.png" alt="InteliCON" className="h-10 w-auto object-contain xl:h-12" />
        </div>
      </div>
      <p className="text-xs font-semibold tracking-widest text-[#fbbf24]">ADMINISTRACIÓN DE CONDOMINIOS</p>
      <div className={`flex flex-col gap-3 ${compacta ? "items-center" : ""}`}>
        <h1
          className={`text-balance font-[family-name:var(--font-login-titulo)] font-bold leading-tight text-[#fefce1] ${
            compacta ? "text-2xl" : "text-3xl xl:text-4xl"
          }`}
        >
          Tu condominio, en orden y en un solo lugar
        </h1>
        <span aria-hidden="true" className="h-1 w-16 rounded-full bg-[#fbbf24]" />
      </div>
      <p className={`text-pretty leading-relaxed text-[#fefce1]/90 ${compacta ? "text-sm" : "text-base xl:text-lg"}`}>
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
    <aside className="hidden bg-[#0d3068] lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:gap-6 lg:overflow-hidden lg:px-12 lg:py-8 xl:px-16 xl:py-10">
      <Marca />
      <ul className="flex flex-col gap-2.5">
        {VENTAJAS.map(({ Icono, texto }) => (
          <li key={texto} className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#b4d9fe]">
              <Icono className="size-4 text-[#0d3068]" aria-hidden="true" />
            </span>
            <span className="text-sm leading-snug text-[#fefce1] xl:text-base">{texto}</span>
          </li>
        ))}
      </ul>
      <div className="flex min-h-32 flex-1 items-end justify-center">
        <div className="relative aspect-[1130/816] h-full max-h-full max-w-full overflow-hidden rounded-3xl border-4 border-[#fefce1]/15">
          {/* La imagen trae franjas celestes a los lados (~90 px de 1312): se centra y se recortan. */}
          <img
            src="/login/condominio-ilustracion.png"
            alt="Ilustración de un condominio con un celular y un notebook mostrando el panel de InteliCON"
            className="absolute left-1/2 top-0 h-full w-auto max-w-none -translate-x-1/2"
          />
        </div>
      </div>
    </aside>
  )
}
