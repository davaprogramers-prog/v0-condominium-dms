"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { KeyRound, LogOut, ShieldCheck, ShieldOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cerrarTodasLasSesiones, quitarFactor, regenerarCodigos } from "@/app/plataforma/acciones"
import { useMfaReciente } from "./use-mfa-reciente"
import { CodigosRecuperacion } from "./codigos-recuperacion"

type Props = {
  factor: { nombre: string; creado: string } | null
  codigosDisponibles: number
  ultimaVerificacion: string | null
}

const fechaHora = (s: string) => new Date(s).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" })

export function PanelSeguridad({ factor, codigosDisponibles, ultimaVerificacion }: Props) {
  const router = useRouter()
  const { ejecutar, dialogo } = useMfaReciente()
  const [pendiente, setPendiente] = useState(false)
  const [error, setError] = useState("")
  const [codigos, setCodigos] = useState<string[] | null>(null)
  const [confirmar, setConfirmar] = useState<"quitar" | "sesiones" | null>(null)
  const [motivo, setMotivo] = useState("")

  const regenerar = async () => {
    setPendiente(true)
    setError("")
    const r = await ejecutar(() => regenerarCodigos())
    setPendiente(false)
    if (!r.ok) return setError(r.error)
    setCodigos(r.codigos)
  }

  const ejecutarConfirmado = async () => {
    setPendiente(true)
    setError("")
    const r = confirmar === "quitar" ? await ejecutar(() => quitarFactor(motivo)) : await ejecutar(() => cerrarTodasLasSesiones())
    setPendiente(false)
    if (!r.ok) return setError(r.error)
    setConfirmar(null)
    router.push("/auth/login")
  }

  if (codigos) {
    return (
      <section className="max-w-lg rounded-lg border bg-card p-6 text-card-foreground">
        <CodigosRecuperacion
          codigos={codigos}
          onListo={() => {
            setCodigos(null)
            router.refresh()
          }}
        />
      </section>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive md:col-span-2">
          {error}
        </p>
      )}

      <section aria-labelledby="t-factor" className="flex flex-col gap-3 rounded-lg border bg-card p-5 text-card-foreground">
        <h2 id="t-factor" className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          Verificación en dos pasos
        </h2>
        {factor ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Estado</dt>
            <dd className="font-medium text-foreground">Activa (TOTP)</dd>
            <dt className="text-muted-foreground">Factor</dt>
            <dd className="text-foreground">{factor.nombre}</dd>
            <dt className="text-muted-foreground">Configurada</dt>
            <dd className="text-foreground">{fechaHora(factor.creado)}</dd>
            <dt className="text-muted-foreground">Último código</dt>
            <dd className="text-foreground">{ultimaVerificacion ? fechaHora(ultimaVerificacion) : "-"}</dd>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">Sin factor activo.</p>
        )}
        <Button variant="outline" className="self-start" disabled={pendiente || !factor} onClick={() => { setMotivo(""); setConfirmar("quitar") }}>
          <ShieldOff className="h-4 w-4" aria-hidden="true" />
          Quitar factor
        </Button>
      </section>

      <section aria-labelledby="t-codigos" className="flex flex-col gap-3 rounded-lg border bg-card p-5 text-card-foreground">
        <h2 id="t-codigos" className="flex items-center gap-2 font-semibold">
          <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />
          Códigos de recuperación
        </h2>
        <p className="text-sm text-foreground">
          {codigosDisponibles} {codigosDisponibles === 1 ? "código disponible" : "códigos disponibles"}.
        </p>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">Generar nuevos invalida todos los anteriores.</p>
        <Button variant="outline" className="self-start" disabled={pendiente} onClick={regenerar}>
          Generar nuevos códigos
        </Button>
      </section>

      <section aria-labelledby="t-sesiones" className="flex flex-col gap-3 rounded-lg border bg-card p-5 text-card-foreground md:col-span-2">
        <h2 id="t-sesiones" className="flex items-center gap-2 font-semibold">
          <LogOut className="h-4 w-4 text-primary" aria-hidden="true" />
          Sesiones
        </h2>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          Cierra tu sesión en todos los dispositivos, incluido este. Úsalo si perdiste un equipo o sospechas de un acceso.
        </p>
        <Button variant="outline" className="self-start" disabled={pendiente} onClick={() => setConfirmar("sesiones")}>
          Cerrar todas las sesiones
        </Button>
      </section>

      <AlertDialog open={confirmar !== null} onOpenChange={(o) => !o && !pendiente && setConfirmar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmar === "quitar" ? "Quitar el factor de verificación" : "Cerrar todas las sesiones"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmar === "quitar"
                ? "Perderás el acceso global hasta configurar un factor nuevo. Se cerrarán todas tus sesiones."
                : "Se cerrará tu sesión en todos los dispositivos y deberás ingresar de nuevo."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirmar === "quitar" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="motivo-quitar">Motivo</Label>
              <Textarea id="motivo-quitar" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={300} rows={3} />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendiente}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void ejecutarConfirmado()
              }}
              disabled={pendiente || (confirmar === "quitar" && motivo.trim().length < 5)}
            >
              {pendiente ? "Procesando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {dialogo}
    </div>
  )
}
