import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserCondoId, getUserHouseId } from "@/lib/supabase/owner-utils"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { ThemeManagerClient } from "@/components/theme-manager-client"
import { ThemeProvider } from "@/app/dashboard/theme-context"
import { type CondoTheme } from "@/lib/theme-utils"

// Force rebuild - v0 fix for mi-casa pages removed
export const metadata = {
  title: "Dashboard - InteliCon",
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  let profile: any = null

  // Try to read profile with safe fallback
  try {
    const { data: profileData, error: pError } = await supabase
      .from("profiles")
      .select("role, condo_id, house_id, first_name, last_name, avatar_url")
      .eq("id", user.id)
      .single()

    if (profileData && !pError) {
      profile = profileData
    }
  } catch (e) {
    console.error("[v0] Error reading profile:", e)
  }

  // Check if super_admin from profiles table
  const isSuperAdmin = profile?.role === "super_admin"
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
    profile = {
      role: user.user_metadata?.role || "propietario",
      condo_id: user.user_metadata?.condo_id || null,
      house_id: user.user_metadata?.house_id || null,
      first_name: user.user_metadata?.first_name || user.user_metadata?.name || user.email?.split("@")[0] || "Usuario",
      last_name: user.user_metadata?.last_name || "",
      avatar_url: null,
    }
  }

  // If propietario/owner without condo_id, they need setup
  // The ensureUserProfile action in login-form should have handled this
  if (isOwner && !profile.condo_id) {
    profile.needs_setup = true
  }

  let condo = null
  let allCondos: { id: string; name: string }[] = []
  let theme: CondoTheme | null = null
  let hasMultipleProperties = false

  if (profile.condo_id) {
    try {
      const { data } = await supabase
        .from("condominiums")
        .select("id, name, currency_symbol, logo_url")
        .eq("id", profile.condo_id)
        .single()
      condo = data

      // Try to fetch condominium theme - will return null if table doesn't exist
      const { data: themeData } = await supabase
        .from("condominium_themes")
        .select("*")
        .eq("condo_id", profile.condo_id)
        .single()
      
      if (themeData) {
        theme = themeData as CondoTheme
      }
    } catch (e) {
      console.log("[v0] Error fetching condo or theme:", e)
    }
  }

  // For owners, check if they have multiple properties across all condos
  if (isOwner && user.email) {
    try {
      const { data: houses } = await supabase
        .from("houses")
        .select("id, condo_id")
        .eq("owner_email", user.email)
      
      if (houses && houses.length > 1) {
        hasMultipleProperties = true
      }
    } catch (e) {
      console.log("[v0] Error checking properties:", e)
    }
  }

  // For admin/super_admin, fetch their condos via user_condos
  if (profile.role === "super_admin" || profile.role === "admin") {
    try {
      const { data: userCondos } = await supabase
        .from("user_condos")
        .select("condo_id, condominiums(id, name)")
        .eq("user_id", user.id)
      
      if (userCondos) {
        allCondos = userCondos
          .filter(uc => uc.condominiums)
          .map(uc => ({
            id: (uc.condominiums as any).id,
            name: (uc.condominiums as any).name
          }))
      }
    } catch (e) {
      console.log("[v0] Error fetching user condos:", e)
    }
  }

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
          <DashboardHeader user={user} profile={profile} />
          <main 
            className="flex-1 overflow-y-auto p-4 md:p-6"
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

