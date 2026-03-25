import { createClient } from "@/lib/supabase/server"
import { getCondoIncome, getHouses } from "./actions"
import { CreateIncomeDialog } from "./create-income-dialog"
import { EditIncomeDialog } from "./edit-income-dialog"
import { Pencil } from "lucide-react"

export default async function IngresosPage({
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

  // Get income and houses
  let income: any[] = []
  let houses: any[] = []

  if (condoId) {
    income = await getCondoIncome(condoId, year, month)
    houses = await getHouses(condoId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ingresos (HABER)</h1>
          <p className="text-muted-foreground">Registro de ingresos del condominio</p>
        </div>
        {isAdmin && condoId && (
          <CreateIncomeDialog condoId={condoId} houses={houses} />
        )}
      </div>

      {/* Income Table */}
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left font-semibold">Fecha</th>
                <th className="px-6 py-3 text-left font-semibold">Casa</th>
                <th className="px-6 py-3 text-left font-semibold">Tipo</th>
                <th className="px-6 py-3 text-left font-semibold">Descripción</th>
                <th className="px-6 py-3 text-left font-semibold">Monto</th>
                <th className="px-6 py-3 text-left font-semibold">Comprobante</th>
                {isAdmin && <th className="px-6 py-3 text-left font-semibold">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {income && income.length > 0 ? (
                income.map((inc) => {
                  const incomeYear = new Date(inc.income_date).getFullYear()
                  const incomeMonth = new Date(inc.income_date).getMonth() + 1
                  const isCurrentIncomeMonth = incomeYear === currentYear && incomeMonth === currentMonth
                  const canEdit = isCurrentIncomeMonth || isAdmin

                  const house = inc.house_id ? houses.find((h) => h.id === inc.house_id) : null

                  return (
                    <tr key={inc.id} className="border-b hover:bg-muted/50">
                      <td className="px-6 py-3 text-muted-foreground text-sm">
                        {new Date(inc.income_date).toLocaleDateString("es-CL")}
                      </td>
                      <td className="px-6 py-3">
                        {house ? `Casa #${house.house_number}` : "-"}
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
                      <td className="px-6 py-3 text-muted-foreground text-xs">
                        {inc.description || "-"}
                      </td>
                      <td className="px-6 py-3 font-semibold text-green-600">
                        ${inc.amount.toLocaleString("es-CL", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </td>
                      <td className="px-6 py-3">
                        {inc.receipt_url ? (
                          <a
                            href={inc.receipt_url}
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
                            <EditIncomeDialog income={inc} houses={houses} />
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
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-8 text-center text-muted-foreground">
                    No hay ingresos registrados para este período.
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

