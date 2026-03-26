import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

export const metadata = {
  title: "Dashboard - CondoAdmin",
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, condo_id, house_id, first_name, last_name")
    .eq("id", user.id)
    .single()

  // If no profile, redirect to login
  if (!profile) {
    redirect("/auth/login")
  }

  // If super_admin without condo_id, redirect to admin panel to select one
  if (profile.role === "super_admin" && !profile.condo_id) {
    redirect("/admin")
  }

  // If propietario without condo_id, try to get it from their house
  if (profile.role === "propietario" && !profile.condo_id && profile.house_id) {
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

  // If regular user without condo_id and no house_id, redirect to login
  if (!profile.condo_id && profile.role !== "propietario") {
    redirect("/auth/login")
  }
  
  // If propietario still has no condo_id, show error
  if (!profile.condo_id) {
    redirect("/auth/login?error=No+tienes+una+propiedad+asignada")
  }

  let condo = null
  let allCondos: { id: string; name: string }[] = []

  if (profile.condo_id) {
    const { data } = await supabase
      .from("condominiums")
      .select("id, name, currency_symbol")
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

