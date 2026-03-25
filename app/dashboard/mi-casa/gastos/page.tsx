import { createClient } from "@/lib/supabase/server"
import { createExpense, getExpenses } from "./actions"
import { CreateExpenseDialog } from "./create-expense-dialog"
import { Banknote } from "lucide-react"

export default async function GastosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user's house
  const { data: profile } = await supabase
    .from("profiles")
    .select("house_id")
    .eq("id", user?.id)
    .single()

  const houseId = profile?.house_id

  // Get expenses
  let expenses: any[] = []
  if (houseId) {
    expenses = await getExpenses(houseId)
  }

  // Calculate totals
  const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
  const expenseCount = expenses.length

  // Group by category
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
          <p className="text-muted-foreground">Registro de gastos de tu propiedad</p>
        </div>
        {houseId && <CreateExpenseDialog houseId={houseId} />}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Gastos</p>
              <p className="text-3xl font-bold">
                ${totalAmount.toLocaleString("es-CL", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <Banknote className="h-8 w-8 text-primary opacity-20" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Cantidad de Registros</p>
              <p className="text-3xl font-bold">{expenseCount}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">{expenseCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left font-semibold">Fecha</th>
                <th className="px-6 py-3 text-left font-semibold">Título</th>
                <th className="px-6 py-3 text-left font-semibold">Categoría</th>
                <th className="px-6 py-3 text-left font-semibold">Descripción</th>
                <th className="px-6 py-3 text-left font-semibold">Monto</th>
                <th className="px-6 py-3 text-left font-semibold">Boleta</th>
              </tr>
            </thead>
            <tbody>
              {expenses && expenses.length > 0 ? (
                expenses.map((expense) => (
                  <tr key={expense.id} className="border-b hover:bg-muted/50">
                    <td className="px-6 py-3 text-muted-foreground">
                      {new Date(expense.expense_date).toLocaleDateString("es-CL")}
                    </td>
                    <td className="px-6 py-3 font-medium">{expense.title}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        {categories[expense.category] || expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground text-xs max-w-xs truncate">
                      {expense.description || "-"}
                    </td>
                    <td className="px-6 py-3 font-semibold">
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
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No hay gastos registrados. Comienza a registrar tus gastos.
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

