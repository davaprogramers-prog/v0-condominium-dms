import { createClient } from "@/lib/supabase/server"
import { getCondoExpenses, getLast12MonthsData } from "./actions"
import { CreateExpenseDialog } from "./create-expense-dialog"
import { GastosList } from "./gastos-list"
import { GastosChart } from "./gastos-chart"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

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

  // Get expenses, 12-month data, and expense types
  let expenses: any[] = []
  let last12Months: any[] = []
  let expenseTypes: any[] = []
  if (condoId) {
    expenses = await getCondoExpenses(condoId, year, month)
    last12Months = await getLast12MonthsData(condoId)
    
    // Get expense types for this condo
    const { data: types } = await supabase
      .from("expense_types")
      .select("id, name, description")
      .eq("condo_id", condoId)
      .eq("is_active", true)
      .order("name")
    expenseTypes = types || []
  }

  // Navigation
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const canGoNext = year < currentYear || (year === currentYear && month < currentMonth)

  const monthName = new Date(year, month - 1).toLocaleDateString("es-CL", {
    month: "short",
    year: "numeric",
  }).toUpperCase()

  // Build categories map from expense types
  const categories: Record<string, string> = {}
  expenseTypes.forEach((type: any) => {
    categories[type.name] = type.name
  })
  // Add fallback for old entries
  categories["reparacion"] = "Reparacion"
  categories["mantenimiento"] = "Mantenimiento"
  categories["servicios"] = "Servicios"
  categories["suministros"] = "Suministros"
  categories["otro"] = "Otro"

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header with Month Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Gastos (DEBE)</h1>
          <p className="text-muted-foreground text-sm">Registro de gastos comunes del condominio</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-full px-2 py-1">
            <Link href={`/dashboard/gastos?mes=${prevMonth}&año=${prevYear}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="px-2 py-1 text-sm font-medium min-w-[90px] text-center">
              {monthName}
            </span>
            {canGoNext ? (
              <Link href={`/dashboard/gastos?mes=${nextMonth}&año=${nextYear}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {isAdmin && condoId && (
            <CreateExpenseDialog condoId={condoId} expenseTypes={expenseTypes} />
          )}
        </div>
      </div>

      {/* 12-Month Bar Chart */}
      <GastosChart last12Months={last12Months} />

      {/* Total */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-pink-50 dark:bg-pink-950/30 border">
        <span className="font-medium">Total del Periodo</span>
        <span className="text-xl font-bold text-pink-600">
          ${totalExpenses.toLocaleString("es-CL")}
        </span>
      </div>

      {/* Expenses List - Card Style */}
      <GastosList 
        expenses={expenses} 
        categories={categories} 
        isAdmin={isAdmin} 
        currentYear={currentYear}
        currentMonth={currentMonth}
        expenseTypes={expenseTypes}
      />
    </div>
  )
}


