import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ConfiguracionClient } from "./configuracion-client"
import { SetupCondoClient } from "./setup-condo-client"
import { ManageUsersClient } from "./manage-users-client"

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.error("[v0] Auth error in config:", authError)
    redirect("/auth/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("condo_id, role")
    .eq("id", user.id)
    .single()

  if (profileError) {
    console.error("[v0] Profile error in config:", profileError)
    redirect("/auth/login")
  }

  if (!profile || profile.role !== "admin") {
    console.error("[v0] User is not admin", { role: profile?.role })
    redirect("/dashboard")
  }

  // Si no tiene condominio, mostrar SetupCondoClient
  if (!profile.condo_id) {
    return <SetupCondoClient />
  }

  // Si ya tiene condominio, mostrar configuración completa
  const { data: condo, error: condoError } = await supabase
    .from("condominiums")
    .select("*")
    .eq("id", profile.condo_id)
    .single()

  if (condoError) {
    console.error("[v0] Condo fetch error:", condoError)
    return <SetupCondoClient />
  }

  const { data: houses } = await supabase
    .from("houses")
    .select("id, house_number")
    .eq("condo_id", profile.condo_id)
    .order("house_number", { ascending: true })

  return (
    <div className="flex flex-col gap-6">
      <ConfiguracionClient condo={condo} />
      <ManageUsersClient houses={houses || []} />
    </div>
  )
}
