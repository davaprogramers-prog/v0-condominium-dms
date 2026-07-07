import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { InfraccionesClient } from "./infracciones-client"
import { resolvePeriod } from "@/lib/period"
import { PeriodAnchor } from "@/components/period-anchor"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

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

  // Calculate previous and next month for navigation
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const canGoNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)

  const monthName = new Date(year, month - 1).toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  })

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

      {/* Month Navigation - Centered */}
      <div className="flex items-center justify-center gap-4">
        <Link href={`/dashboard/infracciones?mes=${prevMonth}&año=${prevYear}`}>
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <span className="px-4 py-2 text-lg font-semibold capitalize min-w-[180px] text-center">
          {monthName}
        </span>
        {canGoNext ? (
          <Link href={`/dashboard/infracciones?mes=${nextMonth}&año=${nextYear}`}>
            <Button variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="icon" disabled>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Infracciones Client Content */}
      <InfraccionesClient
        infractions={infractions || []}
        houses={houses || []}
        currencySymbol={(condo?.currency_symbol as string) || "$"}
        isAdmin={profile.role === "admin" || profile.role === "super_admin"}
      />
    </div>
  )
}
