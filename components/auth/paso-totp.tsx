"use client"

import { useState, useTransition } from "react"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { ShieldCheck } from "lucide-react"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { usarCodigoRecuperacion, verificarTotpIngreso } from "@/app/auth/acciones-seguridad"

type Props = {
  onVerificado: () => void
  onCancelar: () => void
  onRecuperado: () => void
}

export function PasoTotp({ onVerificado, onCancelar, onRecuperado }: Props) {
  const [codigo, setCodigo] = useState("")
  const [modoRecuperacion, setModoRecuperacion] = useState(false)
  const [codigoRecuperacion, setCodigoRecuperacion] = useState("")
  const [error, setError] = useState("")
  const [pendiente, iniciar] = useTransition()

  const verificar = (valor: string) => {
    if (pendiente || valor.length !== 6) return
    setError("")
    iniciar(async () => {
      const r = await verificarTotpIngreso(valor)
      if (r.ok) onVerificado()
      else {
        setError(r.error)
        setCodigo("")
      }
    })
  }

  const recuperar = (e: React.FormEvent) => {
    e.preventDefault()
    if (pendiente) return
    setError("")
    iniciar(async () => {
      const r = await usarCodigoRecuperacion(codigoRecuperacion)
      if (r.ok) onRecuperado()
      else setError(r.error)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <ShieldCheck className="h-8 w-8 text-blue-600" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-gray-900">Verificación en dos pasos</h2>
        <p className="text-pretty text-sm leading-relaxed text-gray-600">
          {modoRecuperacion
            ? "Ingresa uno de tus códigos de recuperación. Al usarlo se eliminará tu factor actual y deberás configurarlo de nuevo."
            : "Ingresa el código de 6 dígitos de tu aplicación de autenticación."}
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {modoRecuperacion ? (
        <form onSubmit={recuperar} className="flex flex-col gap-3">
          <label htmlFor="codigo-recuperacion" className="text-sm font-medium text-gray-700">
            Código de recuperación
          </label>
          <input
            id="codigo-recuperacion"
            value={codigoRecuperacion}
            onChange={(e) => setCodigoRecuperacion(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="XXXXX-XXXXX"
            className="w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm tracking-widest focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={pendiente || codigoRecuperacion.trim().length < 10}
            className="w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pendiente ? "Validando..." : "Usar código de recuperación"}
          </button>
        </form>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <label htmlFor="codigo-totp" className="sr-only">
            Código de verificación de 6 dígitos
          </label>
          <InputOTP
            id="codigo-totp"
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            value={codigo}
            onChange={setCodigo}
            onComplete={verificar}
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            disabled={pendiente}
            aria-describedby="ayuda-totp"
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} className="h-12 w-11 text-lg" />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <p id="ayuda-totp" className="text-xs text-gray-500">
            Puedes pegar el código completo.
          </p>
          <button
            type="button"
            onClick={() => verificar(codigo)}
            disabled={pendiente || codigo.length !== 6}
            className="w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pendiente ? "Verificando..." : "Verificar"}
          </button>
        </div>
      )}

      <div className="flex flex-col items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => {
            setModoRecuperacion((v) => !v)
            setError("")
          }}
          className="text-blue-600 hover:underline"
        >
          {modoRecuperacion ? "Usar el código de la aplicación" : "No tengo acceso a mi aplicación"}
        </button>
        <button type="button" onClick={onCancelar} className="text-gray-600 hover:underline">
          Cancelar e ingresar con otra cuenta
        </button>
      </div>
    </div>
  )
}
