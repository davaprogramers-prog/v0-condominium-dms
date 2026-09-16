'use client'

import { Suspense, useState } from "react"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ensureUserProfile } from "@/app/auth/actions"

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(true)
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
        let profileResult: Awaited<ReturnType<typeof ensureUserProfile>> | null = null

        try {
          profileResult = await ensureUserProfile(authData.user.id, email)
        } catch (profileError) {
          // Authentication already succeeded; profile provisioning should not
          // incorrectly send the user back to the login form.
          console.error("[v0] Profile setup failed after login:", profileError)
        }

        const nextPath = searchParams.get("next")
        const safeNextPath = nextPath?.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : null

        if (
          !safeNextPath &&
          profileResult?.role &&
          (profileResult.role === "propietario" || profileResult.role === "owner") &&
          profileResult.hasMultipleProperties
        ) {
          router.push("/select-condominium")
        } else {
          router.push(safeNextPath || "/dashboard")
        }
      }
    } catch (err) {
      console.error("[v0] Login request failed:", err)
      setError(err instanceof Error ? err.message : "Error al iniciar sesión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
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
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded border border-gray-300 px-3 py-2 pr-11 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-500 hover:text-blue-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Recordarme en este dispositivo
            </label>
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

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-gray-500 space-y-2">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Link href="/support" className="hover:text-blue-600 transition-colors">
            Soporte
          </Link>
          <span>•</span>
          <Link href="/privacy-policy" className="hover:text-blue-600 transition-colors">
            Políticas de Privacidad
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-blue-600 transition-colors">
            Términos de Servicio
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  )
}

