import { createClient } from "@/lib/supabase/server"
import { getCondoExpenses } from "./actions"
import { CreateExpenseDialog } from "./create-expense-dialog"
import { EditExpenseDialog } from "./edit-expense-dialog"
import { Pencil } from "lucide-react"

export default async function GastosPage({
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
  const isAdmin = profile?.role === "admin"

  // Get period from query params or use current month
  const params = await searchParams
  const now = new Date()
  const year = parseInt(params.año as string) || now.getFullYear()
  const month = parseInt(params.mes as string) || now.getMonth() + 1

  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const isCurrentMonth = year === currentYear && month === currentMonth

  // Get expenses
  let expenses: any[] = []
  if (condoId) {
    expenses = await getCondoExpenses(condoId, year, month)
  }

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
          <h1 className="text-3xl font-bold">Gastos (DEBE)</h1>
          <p className="text-muted-foreground">Registro de gastos comunes del condominio</p>
        </div>
        {isAdmin && condoId && (
          <CreateExpenseDialog condoId={condoId} year={year} month={month} />
        )}
      </div>

      {/* Expenses Table */}
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
                {isAdmin && <th className="px-6 py-3 text-left font-semibold">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {expenses && expenses.length > 0 ? (
                expenses.map((expense) => {
                  const expenseYear = new Date(expense.expense_date).getFullYear()
                  const expenseMonth = new Date(expense.expense_date).getMonth() + 1
                  const isCurrentExpenseMonth = expenseYear === currentYear && expenseMonth === currentMonth
                  const canEdit = isCurrentExpenseMonth || isAdmin

                  return (
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
                      {isAdmin && (
                        <td className="px-6 py-3">
                          {canEdit ? (
                            <EditExpenseDialog expense={expense} />
                          ) : (
                            <span className="text-xs text-muted-foreground">Solo lectura</span>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-muted-foreground">
                    No hay gastos registrados para este período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


