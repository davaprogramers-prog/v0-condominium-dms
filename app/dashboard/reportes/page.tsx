import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getCondoExpenses, getCondoIncome, getPaidCondoIncome, getLast12MonthsData } from "../gastos/actions"
import { TrendingUp, TrendingDown, DollarSign, Clock, CheckCircle } from "lucide-react"
import { ReportesCharts } from "./reportes-charts"
import { getUserCondoId } from "@/lib/supabase/owner-utils"
import { resolvePeriod } from "@/lib/period"
import { PeriodAnchor } from "@/components/period-anchor"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; año?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Get condo_id using the helper function (works for both owners and admins)
  const condoId = await getUserCondoId(supabase, user.id)

  if (!condoId) {
    redirect("/dashboard")
  }

  // Get period from query params, anchored cookie, or fall back to current month
  const params = await searchParams
  const now = new Date()
  const { year, month } = await resolvePeriod(params)

  // Get expenses, income, and 12-month historical data
  let expenses: any[] = []
  let income: any[] = []
  let paidIncome: any[] = []
  let last12Months: any[] = []
  let paidFines: any[] = []

  if (condoId) {
    expenses = await getCondoExpenses(condoId, year, month)
    income = await getCondoIncome(condoId, year, month)
    paidIncome = await getPaidCondoIncome(condoId, year, month)
    last12Months = await getLast12MonthsData(condoId)
    
    // Get paid fines for this period
    const { data: fines } = await supabase
      .from("payment_proofs")
      .select("amount")
      .eq("condo_id", condoId)
      .eq("payment_type", "multas")
      .eq("status", "approved")
      .eq("period_month", month)
      .eq("period_year", year)
    
    paidFines = fines || []
  }

  // Calculate previous and next month for navigation
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const canGoNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
  const totalExpected = income.reduce((sum, inc) => sum + (inc.amount || 0), 0) // Por cobrar
  const totalCollected = paidIncome.reduce((sum, inc) => sum + (inc.amount || 0), 0) // Recaudado de gastos comunes
  const totalCollectedFines = paidFines.reduce((sum, fine) => sum + (fine.amount || 0), 0) // Recaudado de multas
  const totalIncome = totalCollected + totalCollectedFines // Total recaudado (gastos + multas)
  const totalPending = totalExpected - totalCollected // Pendiente

  // Prepare data for charts
  const expensesByCategory: Record<string, number> = {}
  expenses.forEach((exp) => {
    const category = exp.category || "Otro"
    expensesByCategory[category] = (expensesByCategory[category] || 0) + exp.amount
  })

  // Use ONLY paid income for the pie chart (not all income)
  // Include both condo_income (gastos comunes) and payment_proofs (multas)
  const incomeByType: Record<string, number> = {}
  
  paidIncome.forEach((inc) => {
    let type = "Otros"
    if (inc.income_type === "cuota" || inc.income_type === "gasto_comun" || inc.income_type === "fixed") {
      type = "Gastos Comunes"
    } else if (inc.income_type === "gasto_comun_variable" || inc.income_type === "variable") {
      type = "Variables"
    } else if (inc.income_type === "multa") {
      type = "Multas"
    }
    incomeByType[type] = (incomeByType[type] || 0) + inc.amount
  })
  
  // Add paid fines to the income breakdown
  if (totalCollectedFines > 0) {
    incomeByType["Multas"] = (incomeByType["Multas"] || 0) + totalCollectedFines
  }

  const pieExpensesData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
  }))

  const pieIncomeData = Object.entries(incomeByType).map(([name, value]) => ({
    name,
    value,
  }))

  const barData = [
    { nombre: "Por Cobrar", valor: totalExpected, fill: "#3b82f6" },
    { nombre: "Recaudado", valor: totalIncome, fill: "#22c55e" },
    { nombre: "Gastos", valor: totalExpenses, fill: "#ef4444" },
  ]

  const monthName = new Date(year, month - 1).toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-6">
      <PeriodAnchor month={month} year={year} />
      <p className="text-muted-foreground text-sm">Análisis completo de ingresos y gastos</p>

      {/* Month Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Link href={`/dashboard/reportes?mes=${prevMonth}&año=${prevYear}`}>
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <span className="px-4 py-2 text-lg font-semibold capitalize min-w-[180px] text-center">
          {monthName}
        </span>
        {canGoNext ? (
          <Link href={`/dashboard/reportes?mes=${nextMonth}&año=${nextYear}`}>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Por Cobrar</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                ${totalExpected.toLocaleString("es-CL", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500 opacity-30" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Recaudado</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                ${totalCollected.toLocaleString("es-CL", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500 opacity-30" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pendiente</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                ${totalPending.toLocaleString("es-CL", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <Clock className="h-8 w-8 text-amber-500 opacity-30" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Gastos</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                ${totalExpenses.toLocaleString("es-CL", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-500 opacity-30" />
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Balance Real (Recaudado - Gastos)</p>
            <p className={`text-3xl font-bold mt-1 ${totalCollected - totalExpenses >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${(totalCollected - totalExpenses).toLocaleString("es-CL", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
          <TrendingUp className={`h-10 w-10 opacity-30 ${totalIncome - totalExpenses >= 0 ? "text-green-500" : "text-red-500"}`} />
        </div>
      </div>

      {/* Charts Component */}
      <ReportesCharts 
        totalExpenses={totalExpenses}
        totalIncome={totalIncome}
        barData={barData}
        pieExpensesData={pieExpensesData}
        pieIncomeData={pieIncomeData}
        last12Months={last12Months}
        currencySymbol="$"
      />
    </div>
  )
}



