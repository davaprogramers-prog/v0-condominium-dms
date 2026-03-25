import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { TiposExoneracionesClient } from "./tipos-exoneraciones-client"

export default async function TiposExoneracionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id, role")
    .eq("id", user.id)
    .single()

  if (!profile?.condo_id) redirect("/dashboard")

  const { data: exemptionTypes } = await supabase
    .from("exemption_types")
    .select("*")
    .eq("condo_id", profile.condo_id)
    .order("name")

  return (
    <TiposExoneracionesClient
      exemptionTypes={exemptionTypes || []}
      isAdmin={profile.role === "admin"}
    />
  )
}
