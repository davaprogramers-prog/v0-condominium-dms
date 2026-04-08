import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AlertasClient } from "./alertas-client"
import { getUserCondoId } from "@/lib/supabase/owner-utils"

export default async function AlertasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Get condo_id using the helper function (works for both owners and admins)
  const condoId = await getUserCondoId(supabase, user.id)

  if (!condoId) {
    redirect("/dashboard")
  }

  const { data: alerts } = await supabase
    .from("alerts")
    .select("*")
    .eq("condo_id", condoId)
    .order("created_at", { ascending: false })

  return (
    <AlertasClient
      alerts={alerts || []}
      isAdmin={true}
    />
  )
}
