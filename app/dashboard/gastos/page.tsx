import { createClient } from "@/lib/supabase/server"

export default async function GastosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id")
    .eq("id", user?.id)
    .single()

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("condo_id", profile?.condo_id)
    .order("expense_date", { ascending: false })

  const totalExpenses = expenses?.reduce((acc, e) => acc + Number(e.amount || 0), 0) || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gastos</h1>
        <p className="text-muted-foreground">Registro de gastos comunes del condominio</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Gastos</p>
          <p className="text-2xl font-bold mt-2">${totalExpenses.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Gastos Registrados</p>
          <p className="text-2xl font-bold mt-2">{expenses?.length || 0}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Promedio Mensual</p>
          <p className="text-2xl font-bold mt-2">${expenses?.length ? (totalExpenses / 12).toLocaleString() : 0}</p>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left font-semibold">Descripción</th>
                <th className="px-6 py-3 text-left font-semibold">Monto</th>
                <th className="px-6 py-3 text-left font-semibold">Categoría</th>
                <th className="px-6 py-3 text-left font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {expenses?.map((expense) => (
                <tr key={expense.id} className="border-b hover:bg-muted/50">
                  <td className="px-6 py-3 font-medium">{expense.description}</td>
                  <td className="px-6 py-3">${Number(expense.amount).toLocaleString()}</td>
                  <td className="px-6 py-3 text-muted-foreground">{expense.category || "-"}</td>
                  <td className="px-6 py-3 text-muted-foreground text-sm">{new Date(expense.expense_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!expenses?.length && (
          <div className="p-6 text-center text-muted-foreground">
            No hay gastos registrados aún
          </div>
        )}
      </div>
    </div>
  )
}
