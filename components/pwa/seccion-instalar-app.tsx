'use client'

import { useState } from 'react'
import { Monitor, Smartphone, Tablet } from 'lucide-react'
import { InstalarAppDialog } from './instalar-app-dialog'
import { useInstalacionPwa, type Plataforma } from './use-instalacion-pwa'

const BOTONES: { plataforma: Plataforma; linea1: string; linea2: string; icono: React.ComponentType<{ className?: string }> }[] = [
  { plataforma: 'android', linea1: 'Instalar en', linea2: 'Android', icono: Smartphone },
  { plataforma: 'ios', linea1: 'Instalar en', linea2: 'iPhone / iPad', icono: Tablet },
  { plataforma: 'escritorio', linea1: 'Instalar en', linea2: 'Computador', icono: Monitor },
]

export function SeccionInstalarApp() {
  const { plataforma, instalada, puedeInstalarDirecto, instalar } = useInstalacionPwa()
  const [abierto, setAbierto] = useState(false)
  const [elegida, setElegida] = useState<Plataforma>('escritorio')

  const abrir = (p: Plataforma) => {
    setElegida(p)
    setAbierto(true)
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-slate-900 to-slate-800">
      <div className="max-w-4xl mx-auto text-center flex flex-col gap-8">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 text-balance">Instala InteliCon en tu dispositivo</h2>
          <p className="text-base sm:text-lg text-slate-300 text-pretty">
            Gestiona tu condominio desde cualquier lugar. Se instala desde el navegador, sin tiendas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 pt-4">
          {BOTONES.map(({ plataforma: p, linea1, linea2, icono: Icono }) => {
            const destacado = p === plataforma
            return (
              <button
                key={p}
                type="button"
                onClick={() => abrir(p)}
                aria-haspopup="dialog"
                className={`flex w-64 sm:w-auto items-center gap-3 px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/60 ${
                  destacado
                    ? 'bg-[#fefce1] text-[#0d3068]'
                    : 'bg-slate-950 text-white border-2 border-slate-600 hover:border-slate-400'
                }`}
              >
                <Icono className="w-6 h-6 shrink-0" aria-hidden="true" />
                <span className="flex flex-col items-start">
                  <span className="text-xs opacity-80">{linea1}</span>
                  <span className="text-base font-bold">{linea2}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <InstalarAppDialog
        abierto={abierto}
        onAbiertoChange={setAbierto}
        plataformaInicial={elegida}
        plataformaDetectada={plataforma}
        instalada={instalada}
        puedeInstalarDirecto={puedeInstalarDirecto}
        onInstalar={instalar}
      />
    </section>
  )
}
