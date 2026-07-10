import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getCondoIncome, getHouses } from "./actions"
import { CreateIncomeDialog } from "./create-income-dialog"
import { IngresosTable } from "./ingresos-table"
import { getUserCondoId } from "@/lib/supabase/owner-utils"
import { resolvePeriod } from "@/lib/period"
import { PeriodAnchor } from "@/components/period-anchor"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

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

  // Verify user role - only admin and super_admin can access Ingresos
  const { data: userCondo } = await supabase
    .from("condo_users")
    .select("role")
    .eq("user_id", user.id)
    .eq("condo_id", condoId)
    .single()

  const isAdmin = userCondo?.role === "admin" || userCondo?.role === "super_admin"

  // Only allow admin access
  if (!isAdmin) {
    redirect("/dashboard")
  }

  // Get period from query params, anchored cookie, or fall back to current month
  const params = await searchParams
  const now = new Date()
  const { year, month } = await resolvePeriod(params)

  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // Calculate previous and next month for navigation
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const canGoNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)

  const monthName = new Date(year, month - 1).toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  })

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
      <PeriodAnchor month={month} year={year} />
      <p className="text-muted-foreground text-sm">Registro de ingresos del condominio</p>

      {/* Month Navigation - Centered */}
      <div className="flex items-center justify-center gap-4">
        <Link href={`/dashboard/ingresos?mes=${prevMonth}&año=${prevYear}`}>
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <span className="px-4 py-2 text-lg font-semibold capitalize min-w-[180px] text-center">
          {monthName}
        </span>
        {canGoNext ? (
          <Link href={`/dashboard/ingresos?mes=${nextMonth}&año=${nextYear}`}>
            <Button variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="icon" disabled>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Add Income Button - Centered */}
      {isAdmin && condoId && (
        <div className="flex items-center justify-center">
          <CreateIncomeDialog condoId={condoId} houses={houses} />
        </div>
      )}

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

