"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ejecutarBootstrap } from "@/app/plataforma/acciones"

export function FormularioBootstrap({ email }: { email: string }) {
  const router = useRouter()
  const [token, setToken] = useState("")
  const [error, setError] = useState("")
  const [pendiente, iniciar] = useTransition()

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    iniciar(async () => {
      const r = await ejecutarBootstrap(token)
      setToken("")
      if (!r.ok) return setError(r.error)
      router.push("/plataforma")
      router.refresh()
    })
  }

  return (
    <form onSubmit={enviar} className="flex w-full max-w-md flex-col gap-4 rounded-lg border bg-card p-6 text-card-foreground">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold">Alta del primer super administrador</h1>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            Se registrará la cuenta <strong className="text-foreground">{email}</strong>. Este paso funciona una sola vez; después
            deberás configurar la verificación en dos pasos.
          </p>
        </div>
      </div>
      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="token-bootstrap">Secreto de alta inicial</Label>
        <Input
          id="token-bootstrap"
          type="password"
          autoComplete="off"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={pendiente || !token}>
        {pendiente ? "Verificando..." : "Registrar"}
      </Button>
    </form>
  )
}
