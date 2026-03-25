import { createClient } from "@/lib/supabase/server"
import { getCondoIncome, getHouses } from "../ingresos/actions"
import { CreateIncomeDialog } from "../ingresos/create-income-dialog"
import { EditIncomeDialog } from "../ingresos/edit-income-dialog"

export default async function IngresoVariablePage({
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
  const isAdmin = profile?.role === "admin"

  // Get period from query params or use current month
  const now = new Date()
  const year = parseInt(searchParams.año as string) || now.getFullYear()
  const month = parseInt(searchParams.mes as string) || now.getMonth() + 1

  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const isCurrentMonth = year === currentYear && month === currentMonth

  // Get income variables (filter for "variable" type) and houses
  let allIncome: any[] = []
  let variableIncome: any[] = []
  let houses: any[] = []

  if (condoId) {
    allIncome = await getCondoIncome(condoId, year, month)
    variableIncome = allIncome.filter((inc) => inc.income_type === "variable")
    houses = await getHouses(condoId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ingresos Variables (HABER)</h1>
          <p className="text-muted-foreground">Registro de ingresos variables del condominio</p>
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
                <th className="px-6 py-3 text-left font-semibold">Descripción</th>
                <th className="px-6 py-3 text-left font-semibold">Monto</th>
                <th className="px-6 py-3 text-left font-semibold">Comprobante</th>
                {isAdmin && <th className="px-6 py-3 text-left font-semibold">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {variableIncome && variableIncome.length > 0 ? (
                variableIncome.map((inc) => {
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
                  <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-muted-foreground">
                    No hay ingresos variables registrados para este período.
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

