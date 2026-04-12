"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2, AlertCircle } from "lucide-react"
import { registerOwner } from "../actions"

interface House {
  id: string
  house_number: number
  condo_id: string
  condoName: string
}

export function RegistroForm() {
  const [step, setStep] = useState<"email" | "select" | "password">("email")
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
  const supabase = createClient()

  // Step 1: Validate email exists in houses
  const handleEmailValidation = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Check if email exists in houses
      const { data, error: fetchError } = await supabase
        .from("houses")
        .select("id, house_number, condo_id, condominiums(name)")
        .eq("owner_email", email)

      if (fetchError) throw fetchError
      if (!data || data.length === 0) {
        throw new Error("Este correo no está registrado en ninguna propiedad. Contacta al administrador del condominio.")
      }

      // Map houses with condo names
      const mappedHouses: House[] = data.map((h: any) => ({
        id: h.id,
        house_number: h.house_number,
        condo_id: h.condo_id,
        condoName: h.condominiums?.name || "Condominio",
      }))

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

  // Step 3: Create account
  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Validate password
      if (password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres")
      }
      if (password !== passwordConfirm) {
        throw new Error("Las contraseñas no coinciden")
      }

      // Validate house selection
      if (!selectedHouseId) {
        throw new Error("Debes seleccionar una propiedad")
      }

      // Call server action to register owner
      await registerOwner(
        email,
        password,
        firstName || email.split("@")[0],
        lastName || "",
        selectedHouseId
      )

      router.push("/auth/registro-exitoso")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear cuenta")
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
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
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
              minLength={6}
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
              Crear Cuenta
            </button>
          </div>
        </form>
      )}
    </>
  )
}
