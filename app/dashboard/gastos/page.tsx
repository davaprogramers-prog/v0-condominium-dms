import { esSuperAdminEfectivo } from "@/lib/auth/plataforma/guardia"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getCondoExpenses, getLast12MonthsData } from "./actions"
import { CreateExpenseDialog } from "./create-expense-dialog"
import { GastosList } from "./gastos-list"
import { GastosChart } from "./gastos-chart"
import Link from "next/link"
import { ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getUserCondoId } from "@/lib/supabase/owner-utils"
import { resolvePeriod } from "@/lib/period"
import { PeriodAnchor } from "@/components/period-anchor"
import { PeriodSelector } from "@/components/period-selector"

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; año?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Get user profile with condo and role
  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id, role")
    .eq("id", user.id)
    .single()

  if (!profile?.condo_id) {
    redirect("/dashboard")
  }

  const isAdmin = profile.role === "admin" || (profile.role === "super_admin" && (await esSuperAdminEfectivo()))
  if (!isAdmin) {
    redirect("/dashboard")
  }

  const condoId = profile.condo_id
  const isSuperAdmin = (profile.role === "super_admin" && (await esSuperAdminEfectivo()))

  // Get period from query params, anchored cookie, or fall back to current month
  const params = await searchParams
  const now = new Date()
  const { year, month } = await resolvePeriod(params)

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
      <PeriodAnchor month={month} year={year} />
      <p className="text-muted-foreground text-sm">Registro de gastos comunes del condominio</p>

      <PeriodSelector month={month} year={year} />

      {/* Logos and Add Expense Buttons - Centered */}
      {isAdmin && condoId && (
        <div className="flex items-center justify-center gap-4">
          <Link href="/dashboard/gastos/logos">
            <Button variant="outline" size="sm">
              <ImageIcon className="h-4 w-4 mr-2" />
              Logos
            </Button>
          </Link>
          <CreateExpenseDialog condoId={condoId} expenseTypes={expenseTypes} isSuperAdmin={isSuperAdmin} />
        </div>
      )}

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


