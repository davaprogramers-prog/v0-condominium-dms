'use client'

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { iniciarSesion } from "@/app/auth/acciones-seguridad"
import { PasoTotp } from "@/components/auth/paso-totp"
import { SelectorDemo } from "@/components/demo/selector-demo"

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [pasoTotp, setPasoTotp] = useState(false)
  const [aviso, setAviso] = useState("")
  const [destino, setDestino] = useState<string | null>(null)

  const rutaSegura = () => {
    const nextPath = searchParams.get("next")
    return nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : null
  }

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data: nivel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (nivel?.nextLevel === "aal2" && nivel.currentLevel !== "aal2") {
        setPasoTotp(true)
        return
      }
      router.replace(rutaSegura() || "/dashboard")
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, searchParams])

  const continuar = (ruta: string | null) => {
    router.push(ruta || rutaSegura() || "/dashboard")
    router.refresh()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setAviso("")
    setLoading(true)

    try {
      const resultado = await iniciarSesion(email, password)
      if (!resultado.ok) {
        setError(resultado.error)
        return
      }

      const nextPath = rutaSegura()
      const ruta = resultado.configurarPlataforma
        ? "/plataforma"
        : !nextPath &&
        (resultado.rol === "propietario" || resultado.rol === "owner") &&
        resultado.variasPropiedades
          ? "/select-condominium"
          : nextPath || "/dashboard"

      setPassword("")
      if (resultado.requiereTotp) {
        setDestino(ruta)
        setPasoTotp(true)
        return
      }
      continuar(ruta)
    } catch (err) {
      console.error("[auth] Error al iniciar sesión:", (err as Error).message)
      setError("Error al iniciar sesión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const cancelarTotp = async () => {
    await createClient().auth.signOut({ scope: "local" })
    setPasoTotp(false)
    setDestino(null)
  }

  if (pasoTotp) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-lg">
          <PasoTotp
            onVerificado={() => continuar(destino)}
            onCancelar={cancelarTotp}
            onRecuperado={() => {
              setPasoTotp(false)
              setDestino(null)
              setAviso(
                "Se eliminó tu factor de verificación y se cerraron todas tus sesiones. Inicia sesión y vuelve a configurarlo.",
              )
            }}
          />
        </div>
      </div>
    )
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
          {aviso && (
            <div role="status" className="rounded bg-blue-50 p-3 text-sm text-blue-800">
              {aviso}
            </div>
          )}
          {error && (
            <div role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">
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

      <div className="mt-6 flex w-full justify-center">
        <SelectorDemo
          aviso={
            searchParams.get("demo") === "finalizada"
              ? "Tu sesión de demostración terminó. Puedes iniciar una nueva cuando quieras."
              : null
          }
        />
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

