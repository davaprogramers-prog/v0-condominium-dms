"use client"

import { useCallback, useRef, useState, useTransition } from "react"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { revalidarMfa } from "@/app/plataforma/acciones"

type ResultadoAccion = { ok: boolean; error?: string; codigo?: string }

/**
 * Ejecuta una acción de servidor y, si responde MFA_NO_RECIENTE, pide el código TOTP
 * y la reintenta una sola vez.
 */
export function useMfaReciente() {
  const [abierto, setAbierto] = useState(false)
  const [codigo, setCodigo] = useState("")
  const [error, setError] = useState("")
  const [pendiente, iniciar] = useTransition()
  const reintento = useRef<{ fn: () => Promise<ResultadoAccion>; resolver: (r: ResultadoAccion) => void } | null>(null)

  const ejecutar = useCallback(async <T extends ResultadoAccion>(fn: () => Promise<T>): Promise<T> => {
    const r = await fn()
    if (r.ok || r.codigo !== "MFA_NO_RECIENTE") return r
    return new Promise<T>((resolver) => {
      reintento.current = { fn, resolver: resolver as (r: ResultadoAccion) => void }
      setCodigo("")
      setError("")
      setAbierto(true)
    })
  }, [])

  const confirmar = (valor: string) => {
    if (pendiente || valor.length !== 6 || !reintento.current) return
    iniciar(async () => {
      const v = await revalidarMfa(valor)
      if (!v.ok) {
        setError(v.error)
        setCodigo("")
        return
      }
      const actual = reintento.current!
      reintento.current = null
      setAbierto(false)
      actual.resolver(await actual.fn())
    })
  }

  const cancelar = () => {
    reintento.current?.resolver({ ok: false, error: "Operación cancelada." })
    reintento.current = null
    setAbierto(false)
  }

  const dialogo = (
    <Dialog open={abierto} onOpenChange={(o) => !o && cancelar()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirma con tu código</DialogTitle>
          <DialogDescription>
            Esta operación exige haber validado tu código hace menos de 10 minutos.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          <InputOTP
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            value={codigo}
            onChange={setCodigo}
            onComplete={confirmar}
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            disabled={pendiente}
            aria-label="Código de verificación de 6 dígitos"
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} className="h-11 w-10" />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={cancelar} disabled={pendiente}>
            Cancelar
          </Button>
          <Button onClick={() => confirmar(codigo)} disabled={pendiente || codigo.length !== 6}>
            {pendiente ? "Validando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return { ejecutar, dialogo }
}
