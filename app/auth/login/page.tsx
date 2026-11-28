'use client'

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { iniciarSesion } from "@/app/auth/acciones-seguridad"
import { PasoTotp } from "@/components/auth/paso-totp"
import { SelectorDemo } from "@/components/demo/selector-demo"
import { CabeceraMarcaMovil, PanelMarcaEscritorio } from "@/components/auth/panel-marca-login"

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
      }
      // Con sesión válida el middleware ya redirige antes de mostrar esta página. Si aun así
      // llegamos aquí, el servidor no ve la sesión: redirigir desde el cliente solo crea un bucle.
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
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#fefce1] px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border-2 border-[#0d3068]/10 bg-white p-6 text-[#0d3068] shadow-lg sm:p-8">
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

  const vieneAProbar = searchParams.get("demo") === "probar"
  const campo =
    "h-12 w-full rounded-xl border-2 border-[#0d3068]/15 bg-white px-4 text-base text-[#0d3068] placeholder:text-[#0d3068]/40 focus:border-[#0d3068] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#b4d9fe]"
  const enlace =
    "whitespace-nowrap font-semibold text-[#0d3068] underline decoration-[#fbbf24] decoration-2 underline-offset-4 hover:decoration-[#0d3068]"

  return (
    <div className="min-h-dvh bg-[#fefce1] text-[#0d3068] lg:grid lg:grid-cols-2">
      <PanelMarcaEscritorio />
      <CabeceraMarcaMovil />

      <main className="flex flex-col items-center px-4 py-8 sm:px-6 lg:min-h-dvh lg:justify-center lg:py-12">
        <div className="flex w-full max-w-lg flex-col gap-6">
          <section
            aria-labelledby="titulo-ingreso"
            className="flex flex-col gap-6 rounded-3xl border-2 border-[#0d3068]/10 bg-white p-6 shadow-lg sm:p-8"
          >
            <div className="flex flex-col gap-1">
              <h2
                id="titulo-ingreso"
                className="font-[family-name:var(--font-login-titulo)] text-2xl font-bold text-[#0d3068]"
              >
                Inicia sesión
              </h2>
              <p className="text-[#0d3068]/75">Ingresa a la cuenta de tu condominio.</p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              {aviso && (
                <div role="status" className="rounded-xl bg-[#b4d9fe]/40 p-3 text-sm text-[#0d3068]">
                  {aviso}
                </div>
              )}
              {error && (
                <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-semibold text-[#0d3068]">
                  Correo
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={campo}
                  placeholder="tu@email.com"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="password" className="text-sm font-semibold text-[#0d3068]">
                    Contraseña
                  </label>
                  <Link href="/auth/forgot-password" className={`text-sm ${enlace}`}>
                    ¿Olvidé mi contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`${campo} pr-12`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-[#0d3068]/60 hover:text-[#0d3068] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#b4d9fe]"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <label className="mt-1 flex min-h-11 cursor-pointer items-center gap-3 text-sm text-[#0d3068]/85">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="size-5 rounded accent-[#0d3068]"
                  />
                  Recordarme en este dispositivo
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-full bg-[#0d3068] font-[family-name:var(--font-login-titulo)] text-base font-semibold text-[#fefce1] shadow-md transition-colors hover:bg-[#0d3068]/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#fbbf24] disabled:opacity-60"
              >
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </button>
            </form>

            <div className="flex flex-col gap-3 border-t border-[#0d3068]/10 pt-5 text-center text-sm leading-relaxed text-[#0d3068]/85">
              <p className="text-pretty">
                ¿Eres residente y tu administración te dio de alta?{" "}
                <Link href="/auth/registro" className={enlace}>
                  Crea tu cuenta
                </Link>
              </p>
              <p className="text-pretty">
                ¿Quieres InteliCON para tu condominio?{" "}
                <Link href="/contacto" className={enlace}>
                  Solicita una cotización
                </Link>
              </p>
            </div>
          </section>

          <div className={vieneAProbar ? "order-first lg:order-none" : ""}>
            <SelectorDemo
              destacar={vieneAProbar}
              aviso={
                searchParams.get("demo") === "finalizada"
                  ? "Tu sesión de demostración terminó. Puedes iniciar una nueva cuando quieras."
                  : null
              }
            />
          </div>

          <footer className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-[#0d3068]/75">
            <Link href="/support" className="py-2 hover:text-[#0d3068] hover:underline">
              Soporte
            </Link>
            <span aria-hidden="true">•</span>
            <Link href="/privacy-policy" className="py-2 hover:text-[#0d3068] hover:underline">
              Políticas de Privacidad
            </Link>
            <span aria-hidden="true">•</span>
            <Link href="/terms" className="py-2 hover:text-[#0d3068] hover:underline">
              Términos de Servicio
            </Link>
          </footer>
        </div>
      </main>
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

