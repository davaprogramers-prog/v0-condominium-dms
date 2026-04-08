import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getCondoIncome, getHouses } from "./actions"
import { CreateIncomeDialog } from "./create-income-dialog"
import { EditIncomeDialog } from "./edit-income-dialog"
import { IngresosTable } from "./ingresos-table"
import { getUserCondoId } from "@/lib/supabase/owner-utils"

export default async function IngresosPage({
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

  const isAdmin = true

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
    // Filter only "fixed" type - variable income is shown in /ingreso-variable
    income = await getCondoIncome(condoId, year, month, "fixed")
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

