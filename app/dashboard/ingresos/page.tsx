import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
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

  if (!user) redirect("/auth/login")

  // Try to get condo_id from user_condos (for admin/super_admin)
  let condoId: string | null = null

  try {
    const { data: userCondos, error: ucError } = await supabase
      .from("user_condos")
      .select("condo_id")
      .eq("user_id", user.id)
      .limit(1)
      .single()

    if (userCondos?.condo_id && !ucError) {
      condoId = userCondos.condo_id
    }
  } catch (e) {
    console.log("[v0] Error getting user_condos in ingresos:", e)
  }

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

