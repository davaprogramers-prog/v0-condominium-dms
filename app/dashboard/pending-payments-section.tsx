import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PendingPaymentCard } from "./pending-payment-card"

interface PendingDebt {
  houseId: string
  houseNumber: string
  ownerName: string
  commonExpense: number
  variableExpense: number
  finesCLP: number
  finesUF: number
  totalDebt: number
}

export async function PendingPaymentsSection({ condoId, currencySymbol }: { condoId: string; currencySymbol: string }) {
  try {
    const supabase = await createClient()

    // Get all houses in the condo
    const { data: houses } = await supabase
      .from("houses")
      .select("id, house_number, owner_name")
      .eq("condo_id", condoId)

    if (!houses || houses.length === 0) {
      return null
    }

    // Calculate pending debts for each house
    const debtsMap = new Map<string, PendingDebt>()

    // 1. Get pending common expenses (condo_expenses not fully paid)
    const { data: commonExpenses } = await supabase
      .from("condo_expenses")
      .select("id, house_id, amount, is_paid")
      .eq("condo_id", condoId)
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

    // 2. Get pending variable expenses (condo_income non-multas, not approved)
    const { data: variableIncomes } = await supabase
      .from("condo_income")
      .select("id, house_id, amount, income_type, status")
      .eq("condo_id", condoId)
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

    // 3. Get pending fines with amount_pending > 0
    const { data: infractions } = await supabase
      .from("infractions")
      .select("id, house_id, amount_pending, currency")
      .eq("condo_id", condoId)
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

    // Filter only houses with debt
    const housesWithDebt = Array.from(debtsMap.values()).filter(
      (debt) => debt.commonExpense > 0 || debt.variableExpense > 0 || debt.finesCLP > 0 || debt.finesUF > 0
    )

    if (housesWithDebt.length === 0) {
      return null
    }

    // Sort by total debt descending
    housesWithDebt.sort((a, b) => b.totalDebt - a.totalDebt)

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Pendiente de Pago</h2>
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 font-semibold text-sm">
              {housesWithDebt.length}
            </span>
          </div>
          <Link href="/dashboard/deudas-consolidadas">
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              Ver Todas las Deudas
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {housesWithDebt.map((debt) => (
            <PendingPaymentCard
              key={debt.houseId}
              houseNumber={debt.houseNumber}
              ownerName={debt.ownerName}
              totalDebt={debt.totalDebt}
              commonExpense={debt.commonExpense}
              variableExpense={debt.variableExpense}
              finesCLP={debt.finesCLP}
              finesUF={debt.finesUF}
              currencySymbol={currencySymbol}
            />
          ))}
        </div>
      </div>
    )
  } catch (error) {
    console.error("[v0] Error loading pending payments:", error)
    return null
  }
}
