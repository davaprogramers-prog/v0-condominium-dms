import { createClient } from "@/lib/supabase/server"
import { getCondoExpenses, getCondoIncome } from "../gastos/actions"
import { Banknote, TrendingDown, TrendingUp, BarChart3, Wallet } from "lucide-react"

export default async function BalancePage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; año?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id, role")
    .eq("id", user?.id)
    .single()

  const condoId = profile?.condo_id
  
  console.log("[v0] Balance - Profile:", profile)
  console.log("[v0] Balance - CondoId:", condoId)

  // Get period from query params or use current month
  const params = await searchParams
  const now = new Date()
  const year = parseInt(params.año as string) || now.getFullYear()
  const month = parseInt(params.mes as string) || now.getMonth() + 1

  // Get parameters for initial balance
  let parameters: any = null
  if (condoId) {
    const { data } = await supabase
      .from("parameters")
      .select("initial_balance, initial_balance_date")
      .eq("condo_id", condoId)
      .single()
    parameters = data
  }

  // Get expenses and income
  let expenses: any[] = []
  let income: any[] = []

  if (condoId) {
    expenses = await getCondoExpenses(condoId, year, month)
    income = await getCondoIncome(condoId, year, month)
    console.log("[v0] Balance - Expenses count:", expenses.length, "for year:", year, "month:", month)
    console.log("[v0] Balance - Income count:", income.length)
  } else {
    console.log("[v0] Balance - NO CONDO ID, cannot fetch data")
  }

  // Calculate previous balance (saldo anterior)
  // If this is the first month (same as initial_balance_date), use initial_balance
  // Otherwise, calculate from all previous months
  let saldoAnterior = 0
  
  if (condoId && parameters?.initial_balance_date) {
    const initialDate = new Date(parameters.initial_balance_date)
    const initialYear = initialDate.getFullYear()
    const initialMonth = initialDate.getMonth() + 1
    
    // Check if current view is the first month
    if (year === initialYear && month === initialMonth) {
      saldoAnterior = parameters.initial_balance || 0
    } else {
      // Calculate from initial balance + all months before current
      saldoAnterior = parameters.initial_balance || 0
      
      // Get all income and expenses from initial month to previous month
      const { data: allIncome } = await supabase
        .from("condo_income")
        .select("amount, period_year, period_month")
        .eq("condo_id", condoId)
      
      const { data: allExpenses } = await supabase
        .from("condo_expenses")
        .select("amount, period_year, period_month")
        .eq("condo_id", condoId)
      
      // Sum all income and expenses before current month
      const incomeBeforeCurrent = (allIncome || [])
        .filter((i: any) => {
          if (i.period_year < year) return true
          if (i.period_year === year && i.period_month < month) return true
          return false
        })
        .reduce((sum: number, i: any) => sum + (i.amount || 0), 0)
      
      const expensesBeforeCurrent = (allExpenses || [])
        .filter((e: any) => {
          if (e.period_year < year) return true
          if (e.period_year === year && e.period_month < month) return true
          return false
        })
        .reduce((sum: number, e: any) => sum + (e.amount || 0), 0)
      
      saldoAnterior += incomeBeforeCurrent - expensesBeforeCurrent
    }
  }

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
  const totalIncome = income.reduce((sum, inc) => sum + (inc.amount || 0), 0)
  const balanceDelMes = totalIncome - totalExpenses
  const saldoFinal = saldoAnterior + balanceDelMes

  const monthName = new Date(year, month - 1).toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Balance</h1>
        <p className="text-muted-foreground">Resumen financiero del condominio - {monthName}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Saldo Anterior */}
        <div className="rounded-lg border bg-slate-100 dark:bg-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Saldo Anterior</p>
              <p className={`text-2xl font-bold ${saldoAnterior >= 0 ? "text-slate-700 dark:text-slate-200" : "text-red-600"}`}>
                ${saldoAnterior.toLocaleString("es-CL", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <Wallet className="h-8 w-8 text-slate-400 opacity-40" />
          </div>
        </div>

        {/* Ingresos - Green background */}
        <div className="rounded-lg border border-green-600 bg-green-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-100">Ingresos (HABER)</p>
              <p className="text-2xl font-bold text-white">
                ${totalIncome.toLocaleString("es-CL", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-white opacity-40" />
          </div>
        </div>

        {/* Gastos - Red background */}
        <div className="rounded-lg border border-red-600 bg-red-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-100">Gastos (DEBE)</p>
              <p className="text-2xl font-bold text-white">
                ${totalExpenses.toLocaleString("es-CL", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-white opacity-40" />
          </div>
        </div>

        {/* Balance del Mes */}
        <div className={`rounded-lg border-2 bg-card p-6 ${balanceDelMes >= 0 ? "border-green-500" : "border-red-500"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Balance del Mes</p>
              <p className={`text-2xl font-bold ${balanceDelMes >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${balanceDelMes.toLocaleString("es-CL", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <BarChart3 className={`h-8 w-8 opacity-30 ${balanceDelMes >= 0 ? "text-green-500" : "text-red-500"}`} />
          </div>
        </div>

        {/* Saldo Final - Highlighted */}
        <div className={`rounded-lg border-2 p-6 ${saldoFinal >= 0 ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-red-500 bg-red-50 dark:bg-red-950/30"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo Final</p>
              <p className={`text-2xl font-bold ${saldoFinal >= 0 ? "text-blue-600" : "text-red-600"}`}>
                ${saldoFinal.toLocaleString("es-CL", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <Banknote className={`h-8 w-8 opacity-40 ${saldoFinal >= 0 ? "text-blue-500" : "text-red-500"}`} />
          </div>
        </div>
      </div>

      {/* Formula Box */}
      <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/30 p-4">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <strong>Formula del Balance:</strong> Saldo Anterior (${saldoAnterior.toLocaleString("es-CL")}) + Ingresos (${totalIncome.toLocaleString("es-CL")}) - Gastos (${totalExpenses.toLocaleString("es-CL")}) = <strong>Saldo Final (${saldoFinal.toLocaleString("es-CL")})</strong>
        </p>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Desglose Ingresos</h2>
          <div className="space-y-2">
            {(() => {
              const gastosComunes = income.filter(i => i.income_type === "gasto_comun" || i.income_type === "cuota").reduce((s, i) => s + (i.amount || 0), 0)
              const variables = income.filter(i => i.income_type === "gasto_comun_variable" || i.income_type === "variable").reduce((s, i) => s + (i.amount || 0), 0)
              const multas = income.filter(i => i.income_type === "multa").reduce((s, i) => s + (i.amount || 0), 0)
              const otros = totalIncome - gastosComunes - variables - multas
              return (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Gastos Comunes Fijos</span>
                    <span className="font-semibold text-green-600">${gastosComunes.toLocaleString("es-CL")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Gastos Comunes Variables</span>
                    <span className="font-semibold text-green-600">${variables.toLocaleString("es-CL")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Multas
                    </span>
                    <span className="font-semibold text-amber-600">${multas.toLocaleString("es-CL")}</span>
                  </div>
                  {otros > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Otros</span>
                      <span className="font-semibold">${otros.toLocaleString("es-CL")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="font-medium">Total</span>
                    <span className="font-bold text-green-600">${totalIncome.toLocaleString("es-CL")}</span>
                  </div>
                </>
              )
            })()}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Desglose Gastos</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Registros de Gastos</span>
              <span className="font-semibold">{expenses.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Promedio por Gasto</span>
              <span className="font-semibold">
                {expenses.length > 0 
                  ? `$${(totalExpenses / expenses.length).toLocaleString("es-CL", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}`
                  : "$0"
                }
              </span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="font-medium">Total</span>
              <span className="font-bold">${totalExpenses.toLocaleString("es-CL")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
