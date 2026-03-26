import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AlertasClient } from "./alertas-client"

export default async function AlertasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id, role")
    .eq("id", user.id)
    .single()

  if (!profile?.condo_id) redirect("/dashboard")

  const { data: alerts } = await supabase
    .from("alerts")
    .select("*")
    .eq("condo_id", profile.condo_id)
    .order("created_at", { ascending: false })

  return (
    <AlertasClient
      alerts={alerts || []}
      isAdmin={profile.role === "admin" || profile.role === "super_admin"}
    />
  )
}
