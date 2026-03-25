import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ManageUsersClient } from "./manage-users-client"

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect("/auth/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("condo_id, role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile?.condo_id) {
    redirect("/dashboard")
  }

  if (profile.role !== "admin") {
    redirect("/dashboard")
  }

  const { data: houses } = await supabase
    .from("houses")
    .select("id, house_number")
    .eq("condo_id", profile.condo_id)
    .order("house_number", { ascending: true })

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .eq("condo_id", profile.condo_id)
    .neq("id", user.id)
    .order("created_at", { ascending: false })

  return <ManageUsersClient users={users || []} houses={houses || []} />
}
