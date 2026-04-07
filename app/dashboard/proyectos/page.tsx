import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProyectosClient } from "./proyectos-client"

export default async function ProyectosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("condo_id, role").eq("id", user.id).single()
  if (!profile?.condo_id) redirect("/dashboard")

  // Verificar que el usuario tiene acceso (super_admin, admin o conserje)
  const allowedRoles = ["super_admin", "admin", "concierge"]
  if (!allowedRoles.includes(profile.role as string)) {
    redirect("/dashboard")
  }

  const { data: condo } = await supabase.from("condominiums").select("currency_symbol").eq("id", profile.condo_id).single()

  const { data: projects } = await supabase
    .from("projects")
    .select("*, project_quotes(*)")
    .eq("condo_id", profile.condo_id)
    .order("created_at", { ascending: false })

  const { data: commonAreas } = await supabase
    .from("common_areas")
    .select("id, name")
    .eq("condo_id", profile.condo_id)
    .order("name")

  return (
    <ProyectosClient
      projects={projects || []}
      commonAreas={commonAreas || []}
      currencySymbol={(condo?.currency_symbol as string) || "$"}
      isAdmin={["admin", "super_admin"].includes(profile.role as string)}
      canView={allowedRoles.includes(profile.role as string)}
    />
  )
}

