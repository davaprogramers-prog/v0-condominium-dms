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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, condo_id, first_name, last_name")
    .eq("id", user.id)
    .single()

  if (!profile || (!profile.condo_id && profile.role !== "super_admin")) {
    redirect("/auth/login")
  }

  let condo = null
  if (profile.condo_id) {
    const { data } = await supabase
      .from("condominiums")
      .select("id, name, currency_symbol")
      .eq("id", profile.condo_id)
      .single()
    condo = data
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} profile={profile} condo={condo} />
      <SidebarInset>
        <DashboardHeader user={user} />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

