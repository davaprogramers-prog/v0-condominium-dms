"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

type UserType = "super_admin" | "condo_admin" | "owner" | "renter"

export function RegistroForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [userType, setUserType] = useState<UserType>("condo_admin")
  const [condoName, setCondoName] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Crear usuario en auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error("No se pudo crear el usuario")

      // 2. Si es admin de condominio, crear condominio
      let condoId = null
      if (userType === "condo_admin" && condoName) {
        const { data: condo, error: condoError } = await supabase
          .from("condominiums")
          .insert([
            {
              name: condoName,
              created_by: authData.user.id,
              currency_symbol: "$",
              currency: "CLP",
              currency_multiplier: 1,
            },
          ])
          .select()
          .single()

        if (condoError) throw condoError
        condoId = condo.id
      }

      // 3. Crear profile
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          role: userType === "condo_admin" ? "admin" : userType,
          condo_id: condoId,
        },
      ])

      if (profileError) throw profileError

      toast.success("Cuenta creada. Por favor verifica tu email")
      router.push("/auth/registro-exitoso")
    } catch (error) {
      console.error("Register error:", error)
      toast.error(error instanceof Error ? error.message : "Error al registrarse")
    } finally {
      setLoading(false)
    }
  }

  const isCondo = userType === "condo_admin"

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">Nombre</Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Tu nombre"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Apellido</Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Tu apellido"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="userType">¿Qué eres?</Label>
        <Select value={userType} onValueChange={(value) => setUserType(value as UserType)}>
          <SelectTrigger id="userType" disabled={loading}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="condo_admin">Admin de Condominio (Crear nuevo)</SelectItem>
            <SelectItem value="owner">Propietario</SelectItem>
            <SelectItem value="renter">Arrendatario</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isCondo && (
        <div className="space-y-2">
          <Label htmlFor="condoName">Nombre del Condominio</Label>
          <Input
            id="condoName"
            type="text"
            placeholder="Ej: Condominio Los Andes"
            value={condoName}
            onChange={(e) => setCondoName(e.target.value)}
            required={isCondo}
            disabled={loading}
          />
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading || (isCondo && !condoName)}>
        {loading ? "Creando cuenta..." : "Registrarse"}
      </Button>
    </form>
  )
}
