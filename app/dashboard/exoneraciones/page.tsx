import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ExoneracionesClient } from "./exoneraciones-client"
import { Shield } from "lucide-react"

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
      {/* Header with Title and Icon */}
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-slate-700 dark:text-slate-300 flex-shrink-0" />
        <h1 className="text-3xl font-bold">Exoneraciones</h1>
      </div>

      {/* Dividing Line */}
      <div className="h-px bg-border" />

      {/* Subtitle with Icon */}
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <p className="text-muted-foreground text-sm">Casos con exoneración de gasto común</p>
      </div>

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
