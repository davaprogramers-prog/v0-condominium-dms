import { esSuperAdminEfectivo } from "@/lib/auth/plataforma/guardia"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { InfraccionesClient } from "./infracciones-client"
import { resolvePeriod } from "@/lib/period"
import { PeriodAnchor } from "@/components/period-anchor"
import { PeriodSelector } from "@/components/period-selector"

export default async function InfraccionesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; año?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("condo_id, role").eq("id", user.id).single()
  if (!profile?.condo_id) redirect("/dashboard")

  const { data: condo } = await supabase.from("condominiums").select("currency_symbol").eq("id", profile.condo_id).single()

  // Get period from query params, anchored cookie, or fall back to current month
  const params = await searchParams
  const now = new Date()
  const { year, month } = await resolvePeriod(params)

  const [{ data: infractions }, { data: houses }] = await Promise.all([
    supabase
      .from("infractions")
      .select("*, houses(house_number)")
      .eq("condo_id", profile.condo_id)
      .order("created_at", { ascending: false }),
    supabase.from("houses").select("id, house_number").eq("condo_id", profile.condo_id).order("house_number"),
  ])

  return (
    <div className="space-y-6">
      <PeriodAnchor month={month} year={year} />
      {/* Subtitle */}
      <p className="text-muted-foreground text-sm">Registro de infracciones del condominio</p>

      <PeriodSelector month={month} year={year} />

      {/* Infracciones Client Content */}
      <InfraccionesClient
        infractions={infractions || []}
        houses={houses || []}
        currencySymbol={(condo?.currency_symbol as string) || "$"}
        isAdmin={profile.role === "admin" || (profile.role === "super_admin" && (await esSuperAdminEfectivo()))}
      />
    </div>
  )
}
