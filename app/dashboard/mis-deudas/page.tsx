import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserCondoId, getUserHouseId } from "@/lib/supabase/owner-utils"
import Link from "next/link"
import { AlertCircle, ChevronRight } from "lucide-react"

interface Debt {
  houseId: string
  houseNumber: string
  ownerName: string
  commonExpense: number
  variableExpense: number
  finesCLP: number
  finesUF: number
  totalDebt: number
}

export default async function MisDeudasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const condoId = await getUserCondoId(supabase, user.id, user.email || undefined)
  if (!condoId) redirect("/dashboard")

  // Get the house(s) for this user
  const houseId = await getUserHouseId(supabase, user.id, user.email || undefined)
  
  if (!houseId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mis Deudas</h1>
          <p className="text-muted-foreground">Visualiza y paga tus deudas pendientes</p>
        </div>
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-muted-foreground">No tienes casas asignadas</p>
        </div>
      </div>
    )
  }

  const houseIds = [houseId]

  // Get house details
  const { data: houses } = await supabase
    .from("houses")
    .select("id, house_number, owner_name")
    .in("id", houseIds)

  if (!houses || houses.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mis Deudas</h1>
          <p className="text-muted-foreground">Visualiza y paga tus deudas pendientes</p>
        </div>
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-muted-foreground">No se encontraron tus casas</p>
        </div>
      </div>
    )
  }

  // Calculate pending debts for each house
  const debtsMap = new Map<string, Debt>()

  // 1. Get pending common expenses
  const { data: commonExpenses } = await supabase
    .from("condo_expenses")
    .select("id, house_id, amount, is_paid")
    .eq("condo_id", condoId)
    .in("house_id", houseIds)
    .eq("is_paid", false)

  if (commonExpenses) {
    for (const expense of commonExpenses) {
      const house = houses.find((h) => h.id === expense.house_id)
      if (house) {
        const key = expense.house_id
        if (!debtsMap.has(key)) {
          debtsMap.set(key, {
            houseId: house.id,
            houseNumber: house.house_number,
            ownerName: house.owner_name,
            commonExpense: 0,
            variableExpense: 0,
            finesCLP: 0,
            finesUF: 0,
            totalDebt: 0,
          })
        }
        const debt = debtsMap.get(key)!
        debt.commonExpense += expense.amount || 0
        debt.totalDebt += expense.amount || 0
      }
    }
  }

  // 2. Get pending variable expenses
  const { data: variableIncomes } = await supabase
    .from("condo_income")
    .select("id, house_id, amount, income_type, status")
    .eq("condo_id", condoId)
    .in("house_id", houseIds)
    .neq("income_type", "multa")
    .neq("status", "approved")

  if (variableIncomes) {
    for (const income of variableIncomes) {
      const house = houses.find((h) => h.id === income.house_id)
      if (house) {
        const key = income.house_id
        if (!debtsMap.has(key)) {
          debtsMap.set(key, {
            houseId: house.id,
            houseNumber: house.house_number,
            ownerName: house.owner_name,
            commonExpense: 0,
            variableExpense: 0,
            finesCLP: 0,
            finesUF: 0,
            totalDebt: 0,
          })
        }
        const debt = debtsMap.get(key)!
        debt.variableExpense += income.amount || 0
        debt.totalDebt += income.amount || 0
      }
    }
  }

  // 3. Get pending fines
  const { data: infractions } = await supabase
    .from("infractions")
    .select("id, house_id, amount_pending, currency")
    .eq("condo_id", condoId)
    .in("house_id", houseIds)
    .gt("amount_pending", 0)

  if (infractions) {
    for (const infraction of infractions) {
      const house = houses.find((h) => h.id === infraction.house_id)
      if (house) {
        const key = infraction.house_id
        if (!debtsMap.has(key)) {
          debtsMap.set(key, {
            houseId: house.id,
            houseNumber: house.house_number,
            ownerName: house.owner_name,
            commonExpense: 0,
            variableExpense: 0,
            finesCLP: 0,
            finesUF: 0,
            totalDebt: 0,
          })
        }
        const debt = debtsMap.get(key)!
        const amount = infraction.amount_pending || 0

        if (infraction.currency === "UF") {
          debt.finesUF += amount
        } else {
          debt.finesCLP += amount
          debt.totalDebt += amount
        }
      }
    }
  }

  // Get condo info for currency
  const { data: condo } = await supabase
    .from("condominiums")
    .select("currency_symbol")
    .eq("id", condoId)
    .single()

  const currencySymbol = condo?.currency_symbol || "$"

  // Filter only houses with debt and sort by total debt descending
  const housesWithDebt = Array.from(debtsMap.values())
    .filter((debt) => debt.commonExpense > 0 || debt.variableExpense > 0 || debt.finesCLP > 0 || debt.finesUF > 0)
    .sort((a, b) => b.totalDebt - a.totalDebt)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mis Deudas</h1>
        <p className="text-muted-foreground">Visualiza y paga tus deudas pendientes</p>
      </div>

      {housesWithDebt.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-muted-foreground">No tienes deudas pendientes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {housesWithDebt.map((debt) => (
            <Link key={debt.houseId} href={`/dashboard/mis-deudas/${debt.houseId}`}>
              <div className="group flex flex-col gap-4 rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 p-4 hover:bg-red-100 transition-all cursor-pointer hover:shadow-md hover:border-red-400">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-red-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <AlertCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-900">Casa #{debt.houseNumber}</h3>
                      <p className="text-sm text-red-700">{debt.ownerName}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-red-400 group-hover:translate-x-1 transition-transform" />
                </div>

                {/* Debt Breakdown */}
                <div className="space-y-2 border-t border-red-200 pt-3">
                  {debt.commonExpense > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-red-700">Gasto Común:</span>
                      <span className="font-semibold text-red-900">
                        {currencySymbol}
                        {debt.commonExpense.toLocaleString("es-CL")}
                      </span>
                    </div>
                  )}
                  {debt.variableExpense > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-red-700">Gasto Variable:</span>
                      <span className="font-semibold text-red-900">
                        {currencySymbol}
                        {debt.variableExpense.toLocaleString("es-CL")}
                      </span>
                    </div>
                  )}
                  {debt.finesCLP > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-red-700">Multas CLP:</span>
                      <span className="font-semibold text-red-900">
                        {currencySymbol}
                        {debt.finesCLP.toLocaleString("es-CL")}
                      </span>
                    </div>
                  )}
                  {debt.finesUF > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-red-700">Multas UF:</span>
                      <span className="font-semibold text-red-900">{debt.finesUF.toFixed(2)} UF</span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between border-t border-red-200 pt-3">
                  <span className="font-semibold text-red-900">Total Deuda:</span>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-red-900">
                      {currencySymbol}
                      {debt.totalDebt.toLocaleString("es-CL")}
                    </span>
                    {debt.finesUF > 0 && (
                      <span className="text-xs text-red-700">+ {debt.finesUF.toFixed(2)} UF</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
