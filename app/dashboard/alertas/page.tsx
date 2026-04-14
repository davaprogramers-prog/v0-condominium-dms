import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AlertasClient } from "./alertas-client"
import { getUserCondoId } from "@/lib/supabase/owner-utils"

export default async function AlertasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Get condo_id and role
  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id, role")
    .eq("id", user.id)
    .single()

  if (!profile?.condo_id) {
    redirect("/dashboard")
  }

  const { data: alerts } = await supabase
    .from("alerts")
    .select("*")
    .eq("condo_id", profile.condo_id)
    .order("created_at", { ascending: false })

  const isAdmin = ["super_admin", "admin"].includes(profile.role as string)

  return (
    <AlertasClient
      alerts={alerts || []}
      isAdmin={isAdmin}
    />
  )
}
