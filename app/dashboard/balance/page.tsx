import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getCondoExpenses, getPaidCondoIncome } from "../gastos/actions"
import { Banknote, TrendingDown, TrendingUp, BarChart3, Wallet, ChevronLeft, ChevronRight } from "lucide-react"
import { getUserCondoId } from "@/lib/supabase/owner-utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function BalancePage({
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

  // Get expenses and PAID income only (with approved payment proofs)
  let expenses: any[] = []
  let paidIncome: any[] = []

  if (condoId) {
    expenses = await getCondoExpenses(condoId, year, month)
    paidIncome = await getPaidCondoIncome(condoId, year, month)
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
      
      // Get all PAID income (with approved proofs) and expenses from initial month to previous month
      const { data: allPaymentProofs } = await supabase
        .from("payment_proofs")
        .select("fixed_amount, variable_amount, period_year, period_month")
        .eq("condo_id", condoId)
        .eq("status", "approved")
      
      const { data: allExpenses } = await supabase
        .from("condo_expenses")
        .select("amount, period_year, period_month")
        .eq("condo_id", condoId)
      
      // Sum all PAID income (from approved payment proofs) before current month
      const paidIncomeBeforeCurrent = (allPaymentProofs || [])
        .filter((p: any) => {
          if (p.period_year < year) return true
          if (p.period_year === year && p.period_month < month) return true
          return false
        })
        .reduce((sum: number, p: any) => sum + (p.fixed_amount || 0) + (p.variable_amount || 0), 0)
      
      const expensesBeforeCurrent = (allExpenses || [])
        .filter((e: any) => {
          if (e.period_year < year) return true
          if (e.period_year === year && e.period_month < month) return true
          return false
        })
        .reduce((sum: number, e: any) => sum + (e.amount || 0), 0)
      
      saldoAnterior += paidIncomeBeforeCurrent - expensesBeforeCurrent
    }
  }

  // Calculate totals - only PAID income
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
  const totalPaidIncome = paidIncome.reduce((sum, inc) => sum + (inc.amount || 0), 0)
  const balanceDelMes = totalPaidIncome - totalExpenses
  const saldoFinal = saldoAnterior + balanceDelMes

  const monthName = new Date(year, month - 1).toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  })

  // Calculate previous and next month for navigation
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const canGoNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">Resumen financiero del condominio</p>

      {/* Month Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Link href={`/dashboard/balance?mes=${prevMonth}&año=${prevYear}`}>
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <span className="px-4 py-2 text-lg font-semibold capitalize min-w-[180px] text-center">
          {monthName}
        </span>
        {canGoNext ? (
          <Link href={`/dashboard/balance?mes=${nextMonth}&año=${nextYear}`}>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Saldo Anterior */}
        <div className="rounded-lg border bg-slate-100 dark:bg-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Saldo Anterior</p>
              <p className={`text-lg md:text-xl font-bold ${saldoAnterior >= 0 ? "text-slate-700 dark:text-slate-200" : "text-red-600"}`}>
                ${saldoAnterior.toLocaleString("es-CL", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <Wallet className="h-8 w-8 text-slate-400 opacity-40" />
          </div>
        </div>

        {/* Ingresos - Green background - Only PAID income */}
        <div className="rounded-lg border border-green-600 bg-green-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-100">Ingresos Recaudados</p>
              <p className="text-lg md:text-xl font-bold text-white">
                ${totalPaidIncome.toLocaleString("es-CL", {
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
              <p className="text-lg md:text-xl font-bold text-white">
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
              <p className={`text-lg md:text-xl font-bold ${balanceDelMes >= 0 ? "text-green-600" : "text-red-600"}`}>
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
              <p className={`text-lg md:text-xl font-bold ${saldoFinal >= 0 ? "text-blue-600" : "text-red-600"}`}>
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
      <div className="rounded-lg border-2 border-cyan-400 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40 p-4">
        <p className="text-sm font-semibold text-cyan-900 dark:text-cyan-100">
          <strong>Fórmula del Balance:</strong> Saldo Anterior (${saldoAnterior.toLocaleString("es-CL")}) + Ingresos Recaudados (${totalPaidIncome.toLocaleString("es-CL")}) - Gastos (${totalExpenses.toLocaleString("es-CL")}) = <strong className="text-cyan-950 dark:text-cyan-50">Saldo Final (${saldoFinal.toLocaleString("es-CL")})</strong>
        </p>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Desglose Ingresos Recaudados</h2>
          <div className="space-y-2">
            {(() => {
              const gastosComunes = paidIncome.filter(i => i.income_type === "gasto_comun" || i.income_type === "cuota" || i.income_type === "fixed").reduce((s, i) => s + (i.amount || 0), 0)
              const variables = paidIncome.filter(i => i.income_type === "gasto_comun_variable" || i.income_type === "variable").reduce((s, i) => s + (i.amount || 0), 0)
              const multas = paidIncome.filter(i => i.income_type === "multa").reduce((s, i) => s + (i.amount || 0), 0)
              const otros = totalPaidIncome - gastosComunes - variables - multas
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
                    <span className="font-medium">Total Recaudado</span>
                    <span className="font-bold text-green-600">${totalPaidIncome.toLocaleString("es-CL")}</span>
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
