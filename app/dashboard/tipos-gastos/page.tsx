import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TiposGastosClient } from "./tipos-gastos-client"

export default async function TiposGastosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  const { data: profile } = await supabase.from("profiles").select("condo_id, role").eq("id", user.id).single()
  if (!profile?.condo_id) redirect("/dashboard")

  const { data: types } = await supabase
    .from("expense_types")
    .select("*")
    .eq("condo_id", profile.condo_id)
    .order("name")

  return <TiposGastosClient types={types || []} isAdmin={profile.role === "admin" || profile.role === "super_admin"} />
}
