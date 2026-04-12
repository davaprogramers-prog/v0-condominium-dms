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

  // If admin, try to get house_id if not already set
  if (isAdmin && !profile?.house_id) {
    console.log("[v0] Admin without house_id, searching for assigned property")
    const houseId = await getUserHouseId(supabase, user.id)
    if (houseId) {
      profile.house_id = houseId
      console.log("[v0] Found house_id for admin:", houseId)
    }
  }

  // If no profile, create fallback from metadata
  if (!profile) {
    profile = {
      role: user.user_metadata?.role || "propietario",
      condo_id: null,
      house_id: null,
      first_name: user.user_metadata?.first_name || user.user_metadata?.name || user.email?.split("@")[0] || "Usuario",
      last_name: user.user_metadata?.last_name || "",
      avatar_url: null,
    }
    console.log("[v0] Created fallback profile from metadata:", profile)
  }

  // If propietario/owner without condo_id, try to get it from their house or admin assignment
  const isOwner = profile.role === "propietario" || profile.role === "owner"
  
  if (isOwner && !profile.condo_id) {
    console.log("[v0] Owner without condo_id, searching via utility function")
    const condoId = await getUserCondoId(supabase, user.id)
    if (condoId) {
      profile.condo_id = condoId
      console.log("[v0] Found condo_id via utility:", condoId)
    }
  }

  if (isOwner && !profile.house_id) {
    console.log("[v0] Owner without house_id, searching via utility function")
    const houseId = await getUserHouseId(supabase, user.id)
    if (houseId) {
      profile.house_id = houseId
      console.log("[v0] Found house_id via utility:", houseId)
    }
  }

  // If still no condo_id and not super_admin/admin, mark as needs setup
  // But allow access to dashboard
  if (!profile.condo_id && profile.role !== "super_admin" && profile.role !== "admin") {
    profile.needs_setup = true
  }

  let condo = null
  let allCondos: { id: string; name: string }[] = []
  let theme: CondoTheme | null = null

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
        <AppSidebar user={user} profile={profile} condo={condo} allCondos={allCondos} />
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

