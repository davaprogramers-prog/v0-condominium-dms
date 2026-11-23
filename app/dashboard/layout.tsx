import { esSuperAdminEfectivo } from "@/lib/auth/plataforma/guardia"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserHouseId } from "@/lib/supabase/owner-utils"
import { perfilActual, usuarioActual } from "@/lib/auth/sesion"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { ThemeManagerClient } from "@/components/theme-manager-client"
import { ThemeProvider } from "@/app/dashboard/theme-context"
import { type CondoTheme } from "@/lib/theme-utils"
import { AvisoDemo } from "@/components/demo/aviso-demo"
import { esUsuarioDemo, etiquetaRolInterno } from "@/lib/demo/reglas"

// Force rebuild - v0 fix for mi-casa pages removed
export const metadata = {
  title: "Dashboard - InteliCon",
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await usuarioActual()

  if (!user) {
    redirect("/auth/login")
  }

  const supabase = await createClient()
  const esDemo = esUsuarioDemo(user)
  let profile: any = await perfilActual(user.id)
  if (profile) profile = { ...profile }

  const isSuperAdmin = profile?.role === "super_admin" && (await esSuperAdminEfectivo())
  const isAdmin = profile?.role === "admin"
  const isOwner = profile?.role === "propietario" || profile?.role === "owner"

  // If admin, try to get house_id if not already set (they might be owner of a property)
  if (isAdmin && !profile?.house_id) {
    const houseId = await getUserHouseId(supabase, user.id, user.email || undefined)
    if (houseId) {
      profile.house_id = houseId
    }
  }

  // If no profile, create fallback from metadata
  if (!profile) {
    const rolServidor = user.app_metadata?.role
    profile = {
      role: rolServidor && rolServidor !== "super_admin" ? rolServidor : "propietario",
      condo_id: user.user_metadata?.condo_id || null,
      house_id: user.user_metadata?.house_id || null,
      first_name: user.user_metadata?.first_name || user.user_metadata?.name || user.email?.split("@")[0] || "Usuario",
      last_name: user.user_metadata?.last_name || "",
      avatar_url: null,
    }
  }

  // Sin registro global activo + AAL2, la UI no debe mostrar opciones de super administrador.
  if (profile.role === "super_admin" && !isSuperAdmin) {
    profile = { ...profile, role: "guest", plataforma_pendiente: true }
  }

  // If propietario/owner without condo_id, they need setup
  // The ensureUserProfile action in login-form should have handled this
  if (isOwner && !profile.condo_id) {
    profile.needs_setup = true
  }

  const esResidente = profile.role === "propietario" || profile.role === "owner"
  const sinDatos = Promise.resolve({ data: null })

  // Consultas independientes en paralelo (antes iban una tras otra: ~1 viaje a la BD por cada una).
  const [casa, condoRes, temaRes, casasRes] = await Promise.all([
    esResidente && profile.house_id
      ? supabase.from("houses").select("house_number").eq("id", profile.house_id).maybeSingle()
      : sinDatos,
    profile.condo_id
      ? supabase.from("condominiums").select("id, name, currency_symbol, logo_url").eq("id", profile.condo_id).maybeSingle()
      : sinDatos,
    profile.condo_id
      ? supabase.from("condominium_themes").select("*").eq("condo_id", profile.condo_id).maybeSingle()
      : sinDatos,
    isOwner && user.email
      ? supabase.from("houses").select("id").eq("owner_email", user.email).limit(2)
      : sinDatos,
  ])

  if (casa.data?.house_number !== undefined) profile.house_number = casa.data.house_number
  const condo = condoRes.data
  const theme = (temaRes.data as CondoTheme | null) ?? null
  const hasMultipleProperties = Array.isArray(casasRes.data) && casasRes.data.length > 1
  const allCondos: { id: string; name: string }[] = []

  return (
    <ThemeProvider theme={theme}>
      <SidebarProvider>
        <ThemeManagerClient theme={theme} condoId={profile.condo_id} />
        <AppSidebar user={user} profile={profile} condo={condo} allCondos={allCondos} hasMultipleProperties={hasMultipleProperties} />
        <SidebarInset 
          className="flex flex-col h-screen"
          style={theme?.enable_custom_theme ? {
            backgroundColor: theme.main_bg_color,
            color: theme.main_text_color,
          } : undefined}
        >
          {esDemo && (
            <AvisoDemo
              rol={etiquetaRolInterno(profile.role)}
              expira={typeof user.app_metadata?.demo_expira === "string" ? user.app_metadata.demo_expira : null}
            />
          )}
          <DashboardHeader user={user} profile={profile} condoName={condo?.name} />
            <main 
            className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-6"
            style={theme?.enable_custom_theme ? {
              backgroundColor: theme.main_bg_color,
              color: theme.main_text_color,
            } : undefined}
          >
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  )
}

