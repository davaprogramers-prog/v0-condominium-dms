import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

async function ensureProfile(supabase: Awaited<ReturnType<typeof createClient>>, user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
  try {
    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (existing) return existing

    // Profile doesn't exist yet - create it from auth metadata
    const meta = user.user_metadata || {}
    const { data: newProfile, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        role: (meta.role as string) || "propietario",
        first_name: (meta.first_name as string) || null,
        last_name: (meta.last_name as string) || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating profile:", error)
      return null
    }
    return newProfile
  } catch (err) {
    console.error("[v0] ensureProfile error:", err)
    return null
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error("[v0] Auth error in layout:", authError)
    redirect("/auth/login")
  }

  const profile = await ensureProfile(supabase, user)

  if (!profile) {
    console.error("[v0] Could not load or create profile")
    redirect("/auth/login")
  }

  let condo = null
  if (profile.condo_id) {
    const { data: condoData, error: condoError } = await supabase
      .from("condominiums")
      .select("*")
      .eq("id", profile.condo_id)
      .single()

    if (condoError) {
      console.error("[v0] Error fetching condo:", condoError)
    } else {
      condo = condoData
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} profile={profile} condo={condo} />
      <SidebarInset>
        <DashboardHeader user={user} profile={profile} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
