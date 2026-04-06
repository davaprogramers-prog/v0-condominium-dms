import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

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

  // For super_admin (davaprogramers@gmail.com), allow access without profile
  const isSuperAdmin = user.user_metadata?.role === "super_admin"

  let profile: any = null
  let profileError = null

  try {
    const { data: profileData, error: pError } = await supabase
      .from("profiles")
      .select("role, condo_id, house_id, first_name, last_name, avatar_url")
      .eq("id", user.id)
      .single()

    if (!pError && profileData) {
      profile = profileData
    } else {
      profileError = pError
    }
  } catch (e) {
    console.error("[v0] Error reading profile:", e)
    profileError = e
  }

  // If no profile, create fallback from metadata
  if (!profile) {
    profile = {
      role: user.user_metadata?.role || "propietario",
      condo_id: null,
      house_id: null,
      first_name: user.user_metadata?.first_name || "Usuario",
      last_name: user.user_metadata?.last_name || "Sin Apellido",
      avatar_url: null,
    }
  }

  // If no condo_id and not super_admin, allow temporary access (no redirect)
  // This permits users to enter dashboard and see an admin message
  if (!profile.condo_id && !isSuperAdmin && profile.role !== "admin") {
    // For regular users without condo, we'll still show dashboard
    // but with limited functionality until admin assigns them
  }

  // If super_admin without condo_id, redirect to admin panel to select one
  if (profile.role === "super_admin" && !profile.condo_id) {
    redirect("/admin")
  }

  // If propietario/owner without condo_id, try to get it from their house
  const isOwner = profile.role === "propietario" || profile.role === "owner"
  
  // If owner without house_id, try to find house by email
  if (isOwner && !profile.house_id) {
    const { data: houseByEmail } = await supabase
      .from("houses")
      .select("id, condo_id")
      .eq("owner_email", user.email)
      .single()
    
    if (houseByEmail) {
      // Update profile with house_id and condo_id
      await supabase
        .from("profiles")
        .update({ 
          house_id: houseByEmail.id,
          condo_id: houseByEmail.condo_id 
        })
        .eq("id", user.id)
      
      profile.house_id = houseByEmail.id
      profile.condo_id = houseByEmail.condo_id
    }
  }
  
  // If has house_id but no condo_id, get condo from house
  if (isOwner && !profile.condo_id && profile.house_id) {
    const { data: house } = await supabase
      .from("houses")
      .select("condo_id")
      .eq("id", profile.house_id)
      .single()
    
    if (house?.condo_id) {
      // Update profile with condo_id
      await supabase
        .from("profiles")
        .update({ condo_id: house.condo_id })
        .eq("id", user.id)
      
      profile.condo_id = house.condo_id
    }
  }

  // If still no condo_id and not super_admin/admin, mark as needs setup
  // But allow access to dashboard
  if (!profile.condo_id && profile.role !== "super_admin" && profile.role !== "admin") {
    profile.needs_setup = true
  }

  let condo = null
  let allCondos: { id: string; name: string }[] = []

  if (profile.condo_id) {
    const { data } = await supabase
      .from("condominiums")
      .select("id, name, currency_symbol, logo_url")
      .eq("id", profile.condo_id)
      .single()
    condo = data
  }

  // For super_admin, fetch all condos they can access
  if (profile.role === "super_admin" || profile.role === "admin") {
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
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} profile={profile} condo={condo} allCondos={allCondos} />
      <SidebarInset>
        <DashboardHeader user={user} />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

