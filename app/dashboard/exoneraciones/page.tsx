import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ExoneracionesClient } from "./exoneraciones-client"

export default async function ExoneracionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("condo_id, role").eq("id", user.id).single()
  if (!profile?.condo_id) redirect("/dashboard")

  const condoId = profile.condo_id

  const [{ data: exemptions }, { data: exemptionTypes }, { data: houses }] = await Promise.all([
    supabase
      .from("exemptions")
      .select("*, exemption_types(name), houses(house_number)")
      .eq("condo_id", condoId)
      .order("created_at", { ascending: false }),
    supabase.from("exemption_types").select("*").eq("condo_id", condoId),
    supabase.from("houses").select("id, house_number").eq("condo_id", condoId).order("house_number"),
  ])

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">Exoneraciones y condonaciones del condominio</p>

      {/* Exoneraciones Client Content */}
      <ExoneracionesClient
        exemptions={exemptions || []}
        exemptionTypes={exemptionTypes || []}
        houses={houses || []}
        isAdmin={profile.role === "admin" || profile.role === "super_admin"}
      />
    </div>
  )
}
