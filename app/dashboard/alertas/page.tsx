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
  try {
    const { data: userCondos, error: ucError } = await supabase
      .from("user_condos")
      .select("condo_id")
      .eq("user_id", user.id)
      .limit(1)
      .single()

    if (userCondos?.condo_id && !ucError) {
      condo_id = userCondos.condo_id
      role = "admin" // If in user_condos, likely admin
    }
  } catch (e) {
    console.log("[v0] No admin condo found:", e)
  }

  // If not found as admin, try to get from houses (for owners)
  if (!condo_id) {
    try {
      const { data: house, error: hError } = await supabase
        .from("houses")
        .select("condo_id")
        .eq("owner_id", user.id)
        .limit(1)
        .single()

      if (house?.condo_id && !hError) {
        condo_id = house.condo_id
      }
    } catch (e) {
      console.log("[v0] No owner house found:", e)
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
