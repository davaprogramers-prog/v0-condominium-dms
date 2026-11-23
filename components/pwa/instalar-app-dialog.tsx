'use client'

import { useState } from 'react'
import { CheckCircle2, Download, EllipsisVertical, Monitor, PlusSquare, Share, Smartphone, Tablet } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Plataforma } from './use-instalacion-pwa'

interface Paso {
  icono: React.ComponentType<{ className?: string }>
  texto: React.ReactNode
}

const PASOS: Record<Plataforma, Paso[]> = {
  ios: [
    { icono: Smartphone, texto: <>Abre esta página en <strong>Safari</strong> (en iPhone o iPad).</> },
    { icono: Share, texto: <>Toca el botón <strong>Compartir</strong> (el cuadrado con una flecha hacia arriba).</> },
    { icono: PlusSquare, texto: <>Desliza y elige <strong>Añadir a pantalla de inicio</strong>.</> },
    { icono: CheckCircle2, texto: <>Toca <strong>Añadir</strong>. InteliCon aparecerá como una app más.</> },
  ],
  android: [
    { icono: Smartphone, texto: <>Abre esta página en <strong>Chrome</strong>.</> },
    { icono: EllipsisVertical, texto: <>Toca el menú de <strong>tres puntos</strong> en la esquina superior derecha.</> },
    { icono: Download, texto: <>Elige <strong>Instalar app</strong> o <strong>Añadir a pantalla de inicio</strong>.</> },
    { icono: CheckCircle2, texto: <>Confirma con <strong>Instalar</strong>. La encontrarás junto a tus apps.</> },
  ],
  escritorio: [
    { icono: Monitor, texto: <>Abre esta página en <strong>Chrome</strong> o <strong>Edge</strong> (Windows o macOS).</> },
    { icono: Download, texto: <>Haz clic en el ícono de <strong>instalar</strong> al final de la barra de direcciones.</> },
    { icono: EllipsisVertical, texto: <>Si no lo ves, abre el menú de <strong>tres puntos</strong> y elige <strong>Instalar InteliCon</strong>.</> },
    { icono: CheckCircle2, texto: <>Confirma con <strong>Instalar</strong>. Se abrirá en su propia ventana.</> },
  ],
}

const ETIQUETAS: Record<Plataforma, { titulo: string; icono: React.ComponentType<{ className?: string }> }> = {
  android: { titulo: 'Android', icono: Smartphone },
  ios: { titulo: 'iPhone / iPad', icono: Tablet },
  escritorio: { titulo: 'Computador', icono: Monitor },
}

interface Props {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  plataformaInicial: Plataforma
  plataformaDetectada: Plataforma
  instalada: boolean
  puedeInstalarDirecto: boolean
  onInstalar: () => Promise<boolean>
}

export function InstalarAppDialog({
  abierto,
  onAbiertoChange,
  plataformaInicial,
  plataformaDetectada,
  instalada,
  puedeInstalarDirecto,
  onInstalar,
}: Props) {
  const [pestana, setPestana] = useState<Plataforma>(plataformaInicial)
  const [instalando, setInstalando] = useState(false)
  const [abiertoPrevio, setAbiertoPrevio] = useState(abierto)

  if (abierto !== abiertoPrevio) {
    setAbiertoPrevio(abierto)
    if (abierto) setPestana(plataformaInicial)
  }

  const instalarDirecto = async () => {
    setInstalando(true)
    try {
      const aceptada = await onInstalar()
      if (aceptada) onAbiertoChange(false)
    } finally {
      setInstalando(false)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={onAbiertoChange}>
      <DialogContent className="bg-[var(--popover)] text-[var(--popover-foreground)] border-[var(--border)] max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Instalar InteliCon</DialogTitle>
          <DialogDescription className="text-[var(--muted-foreground)] leading-relaxed">
            InteliCon es una app web: se instala desde el navegador, sin tiendas y sin ocupar casi espacio.
          </DialogDescription>
        </DialogHeader>

        {instalada ? (
          <div className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-4 text-[var(--secondary-foreground)]">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[var(--primary)]" aria-hidden="true" />
            <p className="text-sm leading-relaxed">Ya estás usando InteliCon instalada en este dispositivo.</p>
          </div>
        ) : (
          <Tabs value={pestana} onValueChange={(v) => setPestana(v as Plataforma)} className="flex flex-col gap-4">
            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-lg bg-[var(--secondary)] p-1">
              {(Object.keys(ETIQUETAS) as Plataforma[]).map((p) => {
                const { titulo, icono: Icono } = ETIQUETAS[p]
                return (
                  <TabsTrigger key={p} value={p} className="flex h-auto flex-col items-center gap-1 rounded-md border border-transparent px-2 py-2 text-xs text-[var(--secondary-foreground)] sm:flex-row sm:text-sm data-[state=active]:border-[var(--border)] data-[state=active]:bg-[var(--popover)] data-[state=active]:font-semibold data-[state=active]:text-[var(--popover-foreground)] data-[state=active]:shadow-sm">
                    <Icono className="size-4" aria-hidden="true" />
                    <span>{titulo}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {(Object.keys(PASOS) as Plataforma[]).map((p) => (
              <TabsContent key={p} value={p} className="flex flex-col gap-4">
                {p === plataformaDetectada && (
                  <p className="text-xs font-medium text-[var(--muted-foreground)]">Detectamos que usas este dispositivo.</p>
                )}

                {p !== 'ios' && p === plataformaDetectada && puedeInstalarDirecto && (
                  <button
                    type="button"
                    onClick={instalarDirecto}
                    disabled={instalando}
                    className="flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    <Download className="size-5" aria-hidden="true" />
                    {instalando ? 'Abriendo instalador…' : 'Instalar ahora'}
                  </button>
                )}

                <ol className="flex flex-col gap-3">
                  {PASOS[p].map((paso, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--secondary-foreground)]">
                        <paso.icono className="size-4" aria-hidden="true" />
                      </span>
                      <span className="pt-1 text-sm leading-relaxed">
                        <span className="sr-only">{`Paso ${i + 1}: `}</span>
                        {paso.texto}
                      </span>
                    </li>
                  ))}
                </ol>

                {p === 'ios' && plataformaDetectada === 'ios' && (
                  <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                    En iPhone y iPad la instalación solo funciona desde Safari.
                  </p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}

        <DialogFooter>
          <button
            type="button"
            onClick={() => onAbiertoChange(false)}
            className="rounded-full border border-[var(--border)] px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--secondary)]"
          >
            Cerrar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
