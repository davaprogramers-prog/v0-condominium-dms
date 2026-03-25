import { createClient } from "@/lib/supabase/server"
import { getCondoExpenses, getCondoIncome, getCondoBalance } from "./actions"
import { CreateExpenseDialog } from "./create-expense-dialog"
import { Banknote, TrendingDown, TrendingUp, BarChart3 } from "lucide-react"

export default async function GastosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id, role")
    .eq("id", user?.id)
    .single()

  const condoId = profile?.condo_id
  const isAdmin = profile?.role === "admin"

  // Get current month and year
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // Get expenses and income for current month
  let expenses: any[] = []
  let income: any[] = []
  let balance: any = null

  if (condoId) {
    expenses = await getCondoExpenses(condoId, currentYear, currentMonth)
    income = await getCondoIncome(condoId, currentYear, currentMonth)
    balance = await getCondoBalance(condoId, currentYear, currentMonth)
  }

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
  const totalIncome = income.reduce((sum, inc) => sum + (inc.amount || 0), 0)
  const netBalance = totalIncome - totalExpenses

  const monthName = new Date(currentYear, currentMonth - 1).toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  })

  const categories: Record<string, string> = {
    reparacion: "Reparación",
    mantenimiento: "Mantenimiento",
    servicios: "Servicios",
    suministros: "Suministros",
    otro: "Otro",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gastos</h1>
          <p className="text-muted-foreground">Registro de gastos comunes del condominio</p>
        </div>
        {isAdmin && condoId && <CreateExpenseDialog condoId={condoId} />}
      </div>

      {/* Period Selector */}
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm text-muted-foreground">Período Actual</p>
        <p className="text-2xl font-bold capitalize">{monthName}</p>
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

      {/* Expenses Table */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Gastos (DEBE)</h2>
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-6 py-3 text-left font-semibold">Descripción</th>
                  <th className="px-6 py-3 text-left font-semibold">Categoría</th>
                  <th className="px-6 py-3 text-left font-semibold">Monto</th>
                  <th className="px-6 py-3 text-left font-semibold">Boleta</th>
                </tr>
              </thead>
              <tbody>
                {expenses && expenses.length > 0 ? (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="border-b hover:bg-muted/50">
                      <td className="px-6 py-3 text-muted-foreground text-sm">
                        {new Date(expense.expense_date).toLocaleDateString("es-CL")}
                      </td>
                      <td className="px-6 py-3 font-medium">{expense.title}</td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                          {categories[expense.category] || expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-semibold text-red-600">
                        ${expense.amount.toLocaleString("es-CL", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </td>
                      <td className="px-6 py-3">
                        {expense.receipt_url ? (
                          <a
                            href={expense.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-xs"
                          >
                            Ver imagen
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No hay gastos registrados para este mes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Income Table */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Ingresos (HABER)</h2>
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-6 py-3 text-left font-semibold">Casa</th>
                  <th className="px-6 py-3 text-left font-semibold">Concepto</th>
                  <th className="px-6 py-3 text-left font-semibold">Descripción</th>
                  <th className="px-6 py-3 text-left font-semibold">Monto</th>
                </tr>
              </thead>
              <tbody>
                {income && income.length > 0 ? (
                  income.map((inc) => (
                    <tr key={inc.id} className="border-b hover:bg-muted/50">
                      <td className="px-6 py-3 text-muted-foreground text-sm">
                        {new Date(inc.income_date).toLocaleDateString("es-CL")}
                      </td>
                      <td className="px-6 py-3">
                        {inc.house_id ? `Casa #${inc.house_id}` : "-"}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          inc.income_type === "cuota"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}>
                          {inc.income_type === "cuota" ? "Cuota" : "Variable"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground text-xs">{inc.description || "-"}</td>
                      <td className="px-6 py-3 font-semibold text-green-600">
                        ${inc.amount.toLocaleString("es-CL", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No hay ingresos registrados para este mes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-lg border bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          <strong>Cálculo del Balance:</strong> Saldo anterior + Ingresos (HABER) - Gastos (DEBE) = Balance del mes
        </p>
      </div>
    </div>
  )
}

