import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AlertasClient } from "./alertas-client"

export default async function AlertasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Get condos from user_condos relationship to avoid RLS issues
  let condo_id: string | null = null
  let role = "propietario"

  // Try to get from user_condos first (for admin/super_admin)
  const { data: userCondos } = await supabase
    .from("user_condos")
    .select("condo_id")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  if (userCondos?.condo_id) {
    condo_id = userCondos.condo_id
    role = "admin" // If in user_condos, likely admin
  } else {
    // Try to get from houses (for owners)
    const { data: house } = await supabase
      .from("houses")
      .select("condo_id")
      .eq("owner_id", user.id)
      .limit(1)
      .single()

    if (house?.condo_id) {
      condo_id = house.condo_id
    }
  }

  if (!condo_id) redirect("/dashboard")

  const { data: alerts } = await supabase
    .from("alerts")
    .select("*")
    .eq("condo_id", condo_id)
    .order("created_at", { ascending: false })

  return (
    <AlertasClient
      alerts={alerts || []}
      isAdmin={role === "admin" || role === "super_admin"}
    />
  )
}
