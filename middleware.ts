import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { CookieOptions } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const isLoginRoute = pathname === "/auth/login"
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname === "/select-condominium" ||
    pathname.startsWith("/plataforma") ||
    pathname.startsWith("/admin")

  if (!user && isProtectedRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/auth/login"
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user?.app_metadata?.demo === true) {
    const salida = await controlarSesionDemo(request, response, supabase, user.id, pathname)
    if (salida) return salida
  }

  if (user && isLoginRoute) {
    const { data: nivel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (nivel?.nextLevel === "aal2" && nivel.currentLevel !== "aal2") return response
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = "/dashboard"
    dashboardUrl.search = ""
    return NextResponse.redirect(dashboardUrl)
  }

  return response
}

const RUTAS_FUERA_DE_DEMO = ["/plataforma", "/admin", "/select-condominium"]

/**
 * Vigencia real (BD) de la sesión demo: si venció o fue liberada, se cierra en el acto
 * aunque el JWT siga vigente. También registra actividad y aleja la demo de rutas globales.
 */
async function controlarSesionDemo(
  request: NextRequest,
  response: NextResponse,
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  pathname: string,
): Promise<NextResponse | null> {
  let expira: string | null = null
  try {
    const service = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data, error } = await service.rpc("fn_demo_tocar", { p_user: userId })
    if (error) throw error
    expira = typeof data === "string" ? data : null
  } catch (err) {
    console.error("[demo] no se pudo verificar la sesión:", (err as Error).message)
    expira = null // falla cerrado
  }

  if (!expira) {
    await supabase.auth.signOut({ scope: "local" })
    const destino = request.nextUrl.clone()
    destino.pathname = "/auth/login"
    destino.search = "?demo=finalizada"
    const redireccion = NextResponse.redirect(destino)
    request.cookies.getAll().forEach((c) => {
      if (c.name.startsWith("sb-")) redireccion.cookies.delete(c.name)
    })
    redireccion.cookies.delete("demo_reanudar")
    return redireccion
  }

  if (RUTAS_FUERA_DE_DEMO.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    const destino = request.nextUrl.clone()
    destino.pathname = "/dashboard"
    destino.search = ""
    const redireccion = NextResponse.redirect(destino)
    response.cookies.getAll().forEach((c) => redireccion.cookies.set(c))
    return redireccion
  }
  return null
}

export const config = {
  matcher: ["/auth/login", "/dashboard/:path*", "/select-condominium", "/plataforma/:path*", "/admin/:path*"],
}
