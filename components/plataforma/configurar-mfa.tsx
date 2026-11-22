"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { confirmarContrasena, iniciarEnrolamiento, verificarEnrolamiento } from "@/app/plataforma/acciones"
import { CodigosRecuperacion } from "./codigos-recuperacion"

type Etapa = "contrasena" | "escanear" | "codigos"

export function ConfigurarMfa() {
  const router = useRouter()
  const [etapa, setEtapa] = useState<Etapa>("contrasena")
  const [password, setPassword] = useState("")
  const [factor, setFactor] = useState<{ factorId: string; qr: string; secreto: string } | null>(null)
  const [codigo, setCodigo] = useState("")
  const [codigos, setCodigos] = useState<string[]>([])
  const [error, setError] = useState("")
  const [mostrarSecreto, setMostrarSecreto] = useState(false)
  const [pendiente, iniciar] = useTransition()

  const confirmar = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    iniciar(async () => {
      const r = await confirmarContrasena(password)
      setPassword("")
      if (!r.ok) return setError(r.error)
      const en = await iniciarEnrolamiento()
      if (!en.ok) return setError(en.error)
      setFactor({ factorId: en.factorId, qr: en.qr, secreto: en.secreto })
      setEtapa("escanear")
    })
  }

  const verificar = (valor: string) => {
    if (!factor || pendiente || valor.length !== 6) return
    setError("")
    iniciar(async () => {
      const r = await verificarEnrolamiento(factor.factorId, valor)
      if (!r.ok) {
        setError(r.error)
        setCodigo("")
        return
      }
      setFactor(null)
      setCodigos(r.codigos)
      setEtapa("codigos")
    })
  }

  return (
    <section aria-labelledby="titulo-mfa" className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-lg border bg-card p-6 text-card-foreground">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <h2 id="titulo-mfa" className="text-lg font-semibold">
            Configura la verificación en dos pasos
          </h2>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            El acceso a la plataforma exige un código TOTP. Hasta que lo configures, tu cuenta no tiene privilegios globales.
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {etapa === "contrasena" && (
        <form onSubmit={confirmar} className="flex flex-col gap-3">
          <Label htmlFor="mfa-password">Confirma tu contraseña</Label>
          <Input
            id="mfa-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" disabled={pendiente || !password}>
            {pendiente ? "Verificando..." : "Continuar"}
          </Button>
        </form>
      )}

      {etapa === "escanear" && factor && (
        <div className="flex flex-col gap-4">
          <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm leading-relaxed text-foreground">
            <li>Abre tu aplicación de autenticación (Google Authenticator, 1Password, Authy u otra).</li>
            <li>Escanea el código QR o ingresa la clave manualmente.</li>
            <li>Escribe el código de 6 dígitos que muestra la aplicación.</li>
          </ol>
          <div className="flex justify-center rounded-md border bg-background p-4">
            {/* El QR es un SVG en data URL generado por el proveedor; no es una imagen remota. */}
            <img src={factor.qr} alt="Código QR para configurar la aplicación de autenticación" className="h-44 w-44" />
          </div>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setMostrarSecreto((v) => !v)}
              className="self-start text-sm text-primary underline-offset-4 hover:underline"
            >
              {mostrarSecreto ? "Ocultar clave" : "No puedo escanear: mostrar clave"}
            </button>
            {mostrarSecreto && (
              <code className="break-all rounded-md bg-muted p-2 font-mono text-sm text-foreground">{factor.secreto}</code>
            )}
          </div>
          <div className="flex flex-col items-center gap-3">
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={codigo}
              onChange={setCodigo}
              onComplete={verificar}
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
            <Button className="w-full" onClick={() => verificar(codigo)} disabled={pendiente || codigo.length !== 6}>
              {pendiente ? "Verificando..." : "Activar"}
            </Button>
          </div>
        </div>
      )}

      {etapa === "codigos" && (
        <CodigosRecuperacion
          codigos={codigos}
          onListo={() => {
            setCodigos([])
            router.refresh()
          }}
        />
      )}
    </section>
  )
}
