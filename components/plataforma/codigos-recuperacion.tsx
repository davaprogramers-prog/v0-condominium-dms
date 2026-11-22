"use client"

import { useState } from "react"
import { Check, Copy, Download, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CodigosRecuperacion({ codigos, onListo }: { codigos: string[]; onListo: () => void }) {
  const [copiado, setCopiado] = useState(false)
  const [confirmado, setConfirmado] = useState(false)

  const copiar = async () => {
    await navigator.clipboard.writeText(codigos.join("\n"))
    setCopiado(true)
  }

  const descargar = () => {
    const blob = new Blob([`Códigos de recuperación - InteliCon Plataforma\n\n${codigos.join("\n")}\n`], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "codigos-recuperacion-plataforma.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-foreground">Guarda tus códigos de recuperación</h3>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            Se muestran una sola vez. Cada uno sirve una vez si pierdes acceso a tu aplicación de autenticación.
            Al usar uno se elimina tu factor y se cierran todas tus sesiones.
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-2 rounded-md border bg-muted p-4 font-mono text-sm" aria-label="Códigos de recuperación">
        {codigos.map((c) => (
          <li key={c} className="text-foreground">
            {c}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={copiar}>
          {copiado ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copiado ? "Copiados" : "Copiar"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={descargar}>
          <Download className="h-4 w-4" aria-hidden="true" />
          Descargar
        </Button>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={confirmado}
          onChange={(e) => setConfirmado(e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        Guardé los códigos en un lugar seguro
      </label>
      <Button type="button" onClick={onListo} disabled={!confirmado}>
        Continuar
      </Button>
    </div>
  )
}
