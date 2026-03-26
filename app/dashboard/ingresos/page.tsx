import { createClient } from "@/lib/supabase/server"
import { getCondoIncome, getHouses } from "./actions"
import { CreateIncomeDialog } from "./create-income-dialog"
import { EditIncomeDialog } from "./edit-income-dialog"
import { IngresosTable } from "./ingresos-table"

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
    // Filter only "cuota" type - variable income is shown in /ingreso-variable
    income = await getCondoIncome(condoId, year, month, "cuota")
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

      {/* Income Table with Image Modal */}
      <IngresosTable 
        income={income} 
        houses={houses} 
        isAdmin={isAdmin} 
        currentYear={currentYear}
        currentMonth={currentMonth}
      />
    </div>
  )
}

