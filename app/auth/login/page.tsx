'use client'

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ensureUserProfile } from "@/app/auth/actions"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      if (authData.user) {
        // Ensure user has a complete profile and get their info
        const profileResult = await ensureUserProfile(authData.user.id, email)
        console.log("[v0] Profile ensured result:", profileResult)
        console.log("[v0] Checking role:", profileResult.role, "hasMultipleProperties:", profileResult.hasMultipleProperties)
        
        // Check if user is an owner with multiple properties
        if ((profileResult.role === 'propietario' || profileResult.role === 'owner') && profileResult.hasMultipleProperties) {
          console.log("[v0] User has multiple properties - redirecting to selector")
          router.push("/select-condominium")
        } else {
          console.log("[v0] User is not owner with multiple properties - redirecting to dashboard. Role:", profileResult.role, "HasMultiple:", profileResult.hasMultipleProperties)
          router.push("/dashboard")
        }
      }
    } catch (err) {
      setError("Error al iniciar sesión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-white p-6 shadow-lg">
        <div className="flex flex-col items-center justify-center gap-3">
          <img 
            src="/intelicon-logo.png" 
            alt="InteliCon Logo" 
            className="h-16 w-auto object-contain"
          />
          <p className="text-sm text-gray-600">Inicia sesión en tu cuenta</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-blue-600 hover:underline"
              >
                ¿Olvidé mi contraseña?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        <div className="text-center text-sm">
          ¿No tienes cuenta?{" "}
          <Link href="/auth/registro" className="font-semibold text-blue-600 hover:underline">
            Registrarse aquí
          </Link>
        </div>
      </div>
    </div>
  )
}
