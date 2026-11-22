"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle, MailCheck } from "lucide-react"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { buscarPropiedadesPorCorreo, registerOwner, solicitarCodigoRegistro } from "../actions"

interface House {
  id: string
  house_number: number
  condo_id: string
  condoName: string
}

export function RegistroForm() {
  const [step, setStep] = useState<"email" | "select" | "password" | "codigo">("email")
  const [codigo, setCodigo] = useState("")
  const [aviso, setAviso] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [houses, setHouses] = useState<House[]>([])
  const [selectedHouseId, setSelectedHouseId] = useState("")
  const router = useRouter()

  // Step 1: Validate email exists in houses
  const handleEmailValidation = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const resultado = await buscarPropiedadesPorCorreo(email)
      if (!resultado.ok) throw new Error(resultado.error)
      if (resultado.propiedades.length === 0) {
        throw new Error("Este correo no está registrado en ninguna propiedad. Contacta al administrador del condominio.")
      }

      const mappedHouses: House[] = resultado.propiedades

      setHouses(mappedHouses)

      // If only one house, skip selection
      if (mappedHouses.length === 1) {
        setSelectedHouseId(mappedHouses[0].id)
        setStep("password")
      } else {
        setStep("select")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al validar correo")
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Select house (if multiple)
  const handleHouseSelection = (houseId: string) => {
    setSelectedHouseId(houseId)
    setStep("password")
  }

  const enviarCodigo = async () => {
    const resultado = await solicitarCodigoRegistro(email, selectedHouseId)
    if (!resultado.ok) throw new Error(resultado.error)
    setCodigo("")
    setAviso(`Enviamos un código de 6 dígitos a ${email}.`)
  }

  // Step 3: datos y clave → se envía el código al correo
  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (password.length < 8) {
        throw new Error("La contraseña debe tener al menos 8 caracteres")
      }
      if (password !== passwordConfirm) {
        throw new Error("Las contraseñas no coinciden")
      }
      if (!selectedHouseId) {
        throw new Error("Debes seleccionar una propiedad")
      }

      await enviarCodigo()
      setStep("codigo")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar el código")
    } finally {
      setLoading(false)
    }
  }

  // Step 4: código del correo → se crea la cuenta
  const crearCuenta = async (valor: string) => {
    if (loading || valor.length !== 6) return
    setError("")
    setLoading(true)
    try {
      const result = await registerOwner(
        email,
        password,
        firstName || email.split("@")[0],
        lastName || "",
        selectedHouseId,
        valor,
      )
      if (!result.success) throw new Error(result.error)
      router.push("/auth/registro-exitoso")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear cuenta")
      setCodigo("")
    } finally {
      setLoading(false)
    }
  }

  const reenviarCodigo = async () => {
    setError("")
    setLoading(true)
    try {
      await enviarCodigo()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar el código")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Step 1: Email Validation */}
      {step === "email" && (
        <form onSubmit={handleEmailValidation} className="space-y-4">
          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />}
            Verificar
          </button>
        </form>
      )}

      {/* Step 2: House Selection */}
      {step === "select" && (
        <div className="space-y-4">
          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <p className="text-sm text-gray-600">Tienes múltiples propiedades. Selecciona una:</p>
          <div className="space-y-2">
            {houses.map((house) => (
              <button
                key={house.id}
                onClick={() => handleHouseSelection(house.id)}
                className="w-full rounded border-2 border-gray-300 p-4 text-left transition-all hover:border-blue-500 hover:bg-blue-50 text-gray-900"
              >
                <div className="font-semibold">Casa #{house.house_number}</div>
                <div className="text-sm text-gray-600">{house.condoName}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Password Setup */}
      {step === "password" && (
        <form onSubmit={handlePasswordSetup} className="space-y-4">
          {selectedHouseId && houses.length > 0 && (
            <div className="rounded bg-green-50 p-3 border border-green-200 text-sm">
              <p className="font-medium text-green-800">Propiedad Asignada:</p>
              <p className="text-green-700">
                Casa #{houses.find(h => h.id === selectedHouseId)?.house_number} - {houses.find(h => h.id === selectedHouseId)?.condoName}
              </p>
            </div>
          )}

          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <input
                id="firstName"
                type="text"
                placeholder="Tu nombre"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Apellido
              </label>
              <input
                id="lastName"
                type="text"
                placeholder="Tu apellido"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              disabled={loading}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700">
              Confirmar Contraseña
            </label>
            <input
              id="passwordConfirm"
              type="password"
              placeholder="Repite tu contraseña"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              disabled={loading}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setStep("email")
                setError("")
              }}
              disabled={loading}
              className="flex-1 rounded border border-gray-300 py-2 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Atrás
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded bg-blue-600 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />}
              Continuar
            </button>
          </div>
        </form>
      )}

      {/* Step 4: código enviado al correo */}
      {step === "codigo" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <MailCheck className="h-8 w-8 text-blue-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-900">Confirma tu correo</h2>
            <p className="text-pretty text-sm leading-relaxed text-gray-600" aria-live="polite">
              {aviso || `Enviamos un código de 6 dígitos a ${email}.`} Vence en 15 minutos.
            </p>
          </div>

          {error && (
            <div role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <label htmlFor="codigo-registro" className="sr-only">
              Código de 6 dígitos enviado a tu correo
            </label>
            <InputOTP
              id="codigo-registro"
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={codigo}
              onChange={setCodigo}
              onComplete={crearCuenta}
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              disabled={loading}
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} className="h-12 w-11 text-lg text-gray-900" />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <button
              type="button"
              onClick={() => crearCuenta(codigo)}
              disabled={loading || codigo.length !== 6}
              className="w-full rounded bg-blue-600 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />}
              Crear Cuenta
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep("password")
                setError("")
              }}
              disabled={loading}
              className="text-gray-600 hover:underline disabled:opacity-50"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={reenviarCodigo}
              disabled={loading}
              className="text-blue-600 hover:underline disabled:opacity-50"
            >
              Reenviar código
            </button>
          </div>
        </div>
      )}
    </>
  )
}
