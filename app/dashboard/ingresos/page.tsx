import { esSuperAdminEfectivo } from "@/lib/auth/plataforma/guardia"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getCondoIncome, getHouses } from "./actions"
import { CreateIncomeDialog } from "./create-income-dialog"
import { IngresosTable } from "./ingresos-table"
import { getUserCondoId } from "@/lib/supabase/owner-utils"
import { resolvePeriod } from "@/lib/period"
import { PeriodAnchor } from "@/components/period-anchor"
import { PeriodSelector } from "@/components/period-selector"

export default async function IngresosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; año?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Get user profile with condo and role
  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id, role")
    .eq("id", user.id)
    .single()

  if (!profile?.condo_id) {
    redirect("/dashboard")
  }

  const isAdmin = profile.role === "admin" || (profile.role === "super_admin" && (await esSuperAdminEfectivo()))
  if (!isAdmin) {
    redirect("/dashboard")
  }

  const condoId = profile.condo_id

  // Get period from query params, anchored cookie, or fall back to current month
  const params = await searchParams
  const now = new Date()
  const { year, month } = await resolvePeriod(params)

  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // Get income and houses
  let income: any[] = []
  let houses: any[] = []

  if (condoId) {
    // Filter only "fixed" type - variable income is shown in /ingreso-variable
    income = await getCondoIncome(condoId, year, month, "fixed")
    houses = await getHouses(condoId)
  }

  return (
    <div className="space-y-6">
      <PeriodAnchor month={month} year={year} />
      <p className="text-muted-foreground text-sm">Registro de ingresos del condominio</p>

      <PeriodSelector month={month} year={year} />

      {/* Add Income Button - Centered */}
      {isAdmin && condoId && (
        <div className="flex items-center justify-center">
          <CreateIncomeDialog condoId={condoId} houses={houses} />
        </div>
      )}

      {/* Income Table with Image Modal */}
      <IngresosTable 
        income={income} 
        houses={houses} 
        isAdmin={isAdmin} 
        currentYear={currentYear}
        currentMonth={currentMonth}
      />
    </div>
  )
}

