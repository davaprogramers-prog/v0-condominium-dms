"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "@/app/dashboard/theme-context"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
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
  const { cardBgColor, cardTextColor, inputBgColor, inputTextColor } = useTheme()

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
    <div className="w-full max-w-md space-y-4">
      {/* Step 1: Email Validation */}
      {step === "email" && (
        <Card style={{ backgroundColor: cardBgColor }}>
          <CardHeader>
            <CardTitle style={{ color: cardTextColor }}>Verificar Correo</CardTitle>
            <CardDescription style={{ color: cardTextColor }}>Ingresa el correo registrado en tu propiedad</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailValidation} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-600 p-4 text-sm text-white border border-red-700 flex items-start gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" style={{ color: cardTextColor }}>Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
                />
              </div>
              <Button type="submit" className="w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Verificar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: House Selection */}
      {step === "select" && (
        <Card style={{ backgroundColor: cardBgColor }}>
          <CardHeader>
            <CardTitle style={{ color: cardTextColor }}>Selecciona tu Propiedad</CardTitle>
            <CardDescription style={{ color: cardTextColor }}>Tienes múltiples propiedades registradas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {houses.map((house) => (
              <button
                key={house.id}
                onClick={() => handleHouseSelection(house.id)}
                className="w-full rounded-lg border-2 border-muted p-4 text-left transition-all hover:border-primary hover:bg-accent"
                style={{ color: cardTextColor }}
              >
                <div className="font-semibold">Casa #{house.house_number}</div>
                <div className="text-sm" style={{ opacity: 0.7 }}>{house.condoName}</div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Password Setup */}
      {step === "password" && (
        <Card style={{ backgroundColor: cardBgColor }}>
          <CardHeader>
            <CardTitle style={{ color: cardTextColor }}>Crear Contraseña</CardTitle>
            <CardDescription style={{ color: cardTextColor }}>Define tu contraseña para acceder</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSetup} className="space-y-4">
              {/* Show assigned property info */}
              {selectedHouseId && houses.length > 0 && (
                <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-green-800 dark:text-green-200">Propiedad Asignada:</p>
                      <p className="text-green-700 dark:text-green-300">
                        Casa #{houses.find(h => h.id === selectedHouseId)?.house_number} - {houses.find(h => h.id === selectedHouseId)?.condoName}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-600 p-4 text-sm text-white border border-red-700 flex items-start gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" style={{ color: cardTextColor }}>Nombre</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Tu nombre"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                    style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" style={{ color: cardTextColor }}>Apellido</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Tu apellido"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                    style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" style={{ color: cardTextColor }}>Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                  style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirm" style={{ color: cardTextColor }}>Confirmar Contraseña</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                  style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setStep("email")
                    setError("")
                  }}
                  disabled={loading}
                >
                  Atrás
                </Button>
                <Button type="submit" className="flex-1 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Crear Cuenta
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
