import { createClient } from "@/lib/supabase/server"
import { getCondoExpenses, getCondoIncome, getCondoBalance } from "../gastos/actions"
import { Banknote, TrendingDown, TrendingUp, BarChart3 } from "lucide-react"

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: { mes?: string; año?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id, role")
    .eq("id", user?.id)
    .single()

  const condoId = profile?.condo_id

  // Get period from query params or use current month
  const now = new Date()
  const year = parseInt(searchParams.año as string) || now.getFullYear()
  const month = parseInt(searchParams.mes as string) || now.getMonth() + 1

  // Get expenses and income
  let expenses: any[] = []
  let income: any[] = []
  let balance: any = null

  if (condoId) {
    expenses = await getCondoExpenses(condoId, year, month)
    income = await getCondoIncome(condoId, year, month)
    balance = await getCondoBalance(condoId, year, month)
  }

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
  const totalIncome = income.reduce((sum, inc) => sum + (inc.amount || 0), 0)
  const netBalance = totalIncome - totalExpenses

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ingresos (HABER)</p>
              <p className="text-2xl font-bold text-green-600">
                ${totalIncome.toLocaleString("es-CL", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Gastos (DEBE)</p>
              <p className="text-2xl font-bold text-red-600">
                ${totalExpenses.toLocaleString("es-CL", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-500 opacity-20" />
          </div>
        </div>

        <div className={`rounded-lg border bg-card p-6 ${netBalance >= 0 ? "border-green-200" : "border-red-200"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Balance del Mes</p>
              <p className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${netBalance.toLocaleString("es-CL", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 opacity-20" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Registros</p>
              <p className="text-2xl font-bold">{expenses.length + income.length}</p>
            </div>
            <Banknote className="h-8 w-8 opacity-20" />
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-lg border bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          <strong>Cálculo del Balance:</strong> Saldo anterior + Ingresos (HABER) - Gastos (DEBE) = Balance del mes
        </p>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Desglose Ingresos</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Registros de Ingresos</span>
              <span className="font-semibold">{income.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Promedio por Ingreso</span>
              <span className="font-semibold">
                {income.length > 0 
                  ? `$${(totalIncome / income.length).toLocaleString("es-CL", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}`
                  : "$0"
                }
              </span>
            </div>
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
          </div>
        </div>
      </div>
    </div>
  )
}

