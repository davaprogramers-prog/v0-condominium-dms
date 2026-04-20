import { createClient } from "@/lib/supabase/server"
import { getCondoIncome } from "../ingresos/actions"
import { IngresoVariableClient } from "./ingreso-variable-client"
import { CreateVariableIncomeDialog } from "./create-variable-income-dialog"
import { redirect } from "next/navigation"
import { getUserCondoId } from "@/lib/supabase/owner-utils"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function IngresoVariablePage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; año?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Get condo_id using the helper function
  const condoId = await getUserCondoId(supabase, user.id)

  if (!condoId) {
    redirect("/dashboard")
  }

  // Get period from query params
  const params = await searchParams
  const now = new Date()
  const year = parseInt(params.año as string) || now.getFullYear()
  const month = parseInt(params.mes as string) || now.getMonth() + 1

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

  // Fetch variable income for the selected month with correct parameters
  let variableIncome: any[] = []
  if (condoId) {
    variableIncome = await getCondoIncome(condoId, year, month, "variable")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">Ingresos variables adicionales del condominio</p>

      {/* Month Navigation - Centered */}
      <div className="flex items-center justify-center gap-4">
        <Link href={`/dashboard/ingreso-variable?mes=${prevMonth}&año=${prevYear}`}>
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <span className="px-4 py-2 text-lg font-semibold capitalize min-w-[180px] text-center">
          {monthName}
        </span>
        {canGoNext ? (
          <Link href={`/dashboard/ingreso-variable?mes=${nextMonth}&año=${nextYear}`}>
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

      {/* Add Variable Income Button - Centered */}
      {isAdmin && condoId && (
        <div className="flex items-center justify-center">
          <CreateVariableIncomeDialog condoId={condoId} />
        </div>
      )}

      {/* Ingreso Variable Client Content */}
      <IngresoVariableClient 
        incomes={variableIncome}
        currencySymbol="$"
        isAdmin={isAdmin}
      />
    </div>
  )
}
