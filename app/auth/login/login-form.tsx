"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ensureUserProfile } from "@/app/auth/actions"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Ensure user has a complete profile after login
      if (authData.user) {
        const profileResult = await ensureUserProfile(authData.user.id, email)
        console.log("[v0] Profile ensured:", profileResult)
        
        // Check if user is an owner with multiple properties
        if ((profileResult.role === 'propietario' || profileResult.role === 'owner') && profileResult.hasMultipleProperties) {
          console.log("[v0] User has multiple properties - redirecting to selector")
          // Redirect to condominium selector
          router.push("/select-condominium")
        } else {
          console.log("[v0] User has single/no properties or is not owner - redirecting to dashboard")
          // Single property, admin or conserje go directly to dashboard
          router.push("/dashboard")
        }
      }

      toast.success("Sesion iniciada correctamente")
    } catch (error) {
      console.error("Login error:", error)
      toast.error(error instanceof Error ? error.message : "Error al iniciar sesion")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Correo electronico</Label>
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Contrasena</Label>
          <Link 
            href="/auth/forgot-password" 
            className="text-sm text-primary hover:underline"
          >
            Olvide mi contrasena
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="Tu contrasena"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Iniciando sesion..." : "Iniciar sesion"}
      </Button>
    </form>
  )
}
