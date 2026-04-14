import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminsTable } from "./admins-table"

export default async function AdministradoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, condo_id")
    .eq("id", user.id)
    .single()

  // Only super_admin can access this page
  if (profile?.role !== "super_admin") {
    redirect("/dashboard")
  }

  const condoId = profile?.condo_id
  if (!condoId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Selecciona un condominio desde el Panel Admin primero.</p>
      </div>
    )
  }

  // Get condo info
  const { data: condo } = await supabase
    .from("condominiums")
    .select("name")
    .eq("id", condoId)
    .single()

  // Get admins for this condo
  const { data: admins } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, created_at, can_change_theme, house_id")
    .eq("condo_id", condoId)
    .eq("role", "admin")
    .order("created_at", { ascending: false })

  // Get all houses for this condo
  const { data: houses } = await supabase
    .from("houses")
    .select("id, house_number")
    .eq("condo_id", condoId)
    .order("house_number", { ascending: true })

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Administradores</h1>
        <p className="text-muted-foreground">
          Gestión de administradores de {condo?.name || "este condominio"}
        </p>
      </div>

      <AdminsTable 
        admins={admins || []} 
        condoId={condoId} 
        condoName={condo?.name || ""}
        houses={houses || []}
      />
    </div>
  )
}
