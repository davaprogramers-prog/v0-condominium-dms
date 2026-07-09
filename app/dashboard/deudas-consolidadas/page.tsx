import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserCondoId } from "@/lib/supabase/owner-utils"
import { DeudasConsolidadasClient } from "./deudas-consolidadas-client"
import { type CondoTheme, DEFAULT_THEME } from "@/lib/theme-utils"

export default async function DeudasConsolidadasPage() {
  const supabase = createClient()
  const { condoId, userId } = await getUserCondoId()

  if (!userId || !condoId) redirect("/auth/login")

  // Get user role to check if is admin/super_admin
  const { data: user } = await supabase.auth.getUser()
  const { data: userCondo } = await supabase
    .from("condo_users")
    .select("role")
    .eq("user_id", user?.user?.id)
    .eq("condo_id", condoId)
    .single()

  // Only admin and super_admin can access
  if (!userCondo || (userCondo.role !== "admin" && userCondo.role !== "super_admin")) {
    redirect("/dashboard")
  }

  // Get condo info
  const { data: condo } = await supabase
    .from("condominiums")
    .select("*")
    .eq("id", condoId)
    .single()

  // Get all houses with their debts consolidated
  const { data: houses } = await supabase
    .from("houses")
    .select("*")
    .eq("condo_id", condoId)
    .order("house_number", { ascending: true })

  // Get pending condo_expenses (gastos comunes) - for each house and month
  const { data: pendingExpenses } = await supabase
    .from("condo_expenses")
    .select("house_id, amount, period_month, period_year")
    .eq("condo_id", condoId)
    .eq("paid", false)
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false })

  // Get pending condo_income for each house (gastos variables, multas, etc)
  const { data: pendingIncome } = await supabase
    .from("condo_income")
    .select("house_id, amount, income_type, description, period_month, period_year")
    .eq("condo_id", condoId)
    .neq("payment_status", "approved")
    .neq("payment_status", "complete") // Exclude paid items
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false })

  // Get pending infractions with their outstanding balance
  const { data: pendingFines } = await supabase
    .from("infractions")
    .select("house_id, fine_amount, amount_pending, currency, payment_status, description")
    .eq("condo_id", condoId)
    .neq("payment_status", "complete")
    .order("infraction_date", { ascending: false })

  // Build consolidated debt map
  const debtByHouse = new Map<string, {
    houseNumber: string | number
    ownerName: string | null
    houseId: string
    commonExpenses: number
    variableExpenses: number
    finesAmount: number
    finesUF: number
    totalDebt: number
    detailsCount: number
  }>()

  // Initialize with all houses
  houses?.forEach((house) => {
    debtByHouse.set(house.id, {
      houseNumber: house.house_number,
      ownerName: house.owner_name,
      houseId: house.id,
      commonExpenses: 0,
      variableExpenses: 0,
      finesAmount: 0,
      finesUF: 0,
      totalDebt: 0,
      detailsCount: 0,
    })
  })

  // Add expenses
  pendingExpenses?.forEach((exp) => {
    const debt = debtByHouse.get(exp.house_id)
    if (debt) {
      debt.commonExpenses += exp.amount || 0
      debt.detailsCount++
    }
  })

  // Add variable income (gastos variables, multas pagadas, etc)
  pendingIncome?.forEach((inc) => {
    const debt = debtByHouse.get(inc.house_id)
    if (debt) {
      if (inc.income_type === "multa") {
        debt.finesAmount += inc.amount || 0
      } else {
        debt.variableExpenses += inc.amount || 0
      }
      debt.detailsCount++
    }
  })

  // Add fines with pending balance
  pendingFines?.forEach((fine) => {
    const debt = debtByHouse.get(fine.house_id)
    if (debt) {
      const amountOwed = fine.amount_pending || fine.fine_amount || 0
      if (fine.currency === "UF") {
        debt.finesUF += amountOwed
      } else {
        debt.finesAmount += amountOwed
      }
      debt.detailsCount++
    }
  })

  // Calculate totals in CLP (for now, fines in UF are separate)
  debtByHouse.forEach((debt) => {
    debt.totalDebt = debt.commonExpenses + debt.variableExpenses + debt.finesAmount
  })

  const consolidatedDebts = Array.from(debtByHouse.values())
    .filter((debt) => debt.totalDebt > 0 || debt.finesUF > 0) // Only show houses with debts
    .sort((a, b) => (b.totalDebt + b.finesUF) - (a.totalDebt + a.finesUF)) // Sort by total debt

  const theme = (condo?.theme as CondoTheme) || DEFAULT_THEME

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: theme.textColor }}>
          Deudas Consolidadas
        </h1>
        <p className="text-sm opacity-75" style={{ color: theme.textColor }}>
          Resumen completo de deudas por casa (gastos comunes, variables y multas)
        </p>
      </div>

      <DeudasConsolidadasClient
        debts={consolidatedDebts}
        currencySymbol={condo?.currency_symbol || "$"}
        theme={theme}
        condoId={condoId}
        userId={userId}
      />
    </div>
  )
}
