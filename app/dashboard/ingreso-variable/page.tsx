import { esSuperAdminEfectivo } from "@/lib/auth/plataforma/guardia"
import { createClient } from "@/lib/supabase/server"
import { getCondoIncome } from "../ingresos/actions"
import { IngresoVariableClient } from "./ingreso-variable-client"
import { CreateVariableIncomeDialog } from "./create-variable-income-dialog"
import { redirect } from "next/navigation"
import { getUserCondoId } from "@/lib/supabase/owner-utils"
import { resolvePeriod } from "@/lib/period"
import { PeriodAnchor } from "@/components/period-anchor"
import { PeriodSelector } from "@/components/period-selector"

export default async function IngresoVariablePage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; año?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Get condo_id using the helper function
  const condoId = await getUserCondoId(supabase, user.id)

  if (!condoId) {
    redirect("/dashboard")
  }

  // Get period from query params, anchored cookie, or fall back to current month
  const params = await searchParams
  const now = new Date()
  const { year, month } = await resolvePeriod(params)

  // Fetch variable income for the selected month with correct parameters
  let variableIncome: any[] = []
  if (condoId) {
    variableIncome = await getCondoIncome(condoId, year, month, "variable")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  const isAdmin = profile?.role === "admin" || (profile?.role === "super_admin" && (await esSuperAdminEfectivo()))
  const isSuperAdmin = (profile?.role === "super_admin" && (await esSuperAdminEfectivo()))

  return (
    <div className="space-y-6">
      <PeriodAnchor month={month} year={year} />
      <p className="text-muted-foreground text-sm">Ingresos variables adicionales del condominio</p>

      <PeriodSelector month={month} year={year} />

      {/* Add Variable Income Button - Centered */}
      {isAdmin && condoId && (
        <div className="flex items-center justify-center">
          <CreateVariableIncomeDialog condoId={condoId} />
        </div>
      )}

      {/* Ingreso Variable Client Content */}
      <IngresoVariableClient 
        incomes={variableIncome}
        currencySymbol="$"
        condoId={condoId}
        isAdmin={isAdmin}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  )
}
