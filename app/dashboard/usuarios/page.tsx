import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CreateUserDialog } from "./create-user-dialog"
import { UserActionsMenu } from "./user-actions-menu"
import { UsuariosClient } from "./usuarios-client"

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id, role")
    .eq("id", user.id)
    .single()

  if (!profile?.condo_id) {
    redirect("/dashboard")
  }

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .eq("condo_id", profile.condo_id)
    .order("created_at", { ascending: false })

  const isAdmin = profile.role === "admin"
  const isSuperAdmin = profile.role === "super_admin"

  // Get condos for super_admin selector
  let condos = []
  if (isSuperAdmin) {
    const { data: condosData } = await supabase
      .from("condominiums")
      .select("id, name")
      .order("name")
    condos = condosData || []
  }

  return (
    <UsuariosClient 
      users={users || []} 
      isAdmin={isAdmin}
      isSuperAdmin={isSuperAdmin}
      condos={condos}
    />
  )
}

