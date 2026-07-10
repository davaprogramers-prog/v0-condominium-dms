import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronRight, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HouseDebt {
  houseId: string
  houseNumber: string
  ownerName: string
  commonExpense: number
  variableExpense: number
  finesCLP: number
  finesUF: number
  totalDebt: number
}

const DEFAULT_THEME = {
  primary_color: "#2563eb",
  secondary_color: "#1e40af",
  accent_color: "#f59e0b",
}

export default async function DeudasConsolidadasPage() {
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

  const isAdmin = profile.role === "admin" || profile.role === "super_admin"
  if (!isAdmin) {
    redirect("/dashboard")
  }

  const condoId = profile.condo_id

  // Get condo info for currency symbol
  const { data: condo } = await supabase
    .from("condominiums")
    .select("currency_symbol, theme")
    .eq("id", condoId)
    .single()

  const currencySymbol = condo?.currency_symbol || "$"
  const theme = condo?.theme ? JSON.parse(condo.theme) : DEFAULT_THEME

  // Get all houses with their debts
  const { data: housesRaw } = await supabase
    .from("houses")
    .select("*")
    .eq("condo_id", condoId)

  const houses = housesRaw || []

  if (houses.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Deudas Consolidadas</h1>
          <p className="text-muted-foreground">Visualiza las deudas de todas las casas</p>
        </div>
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-muted-foreground">No hay casas en el condominio</p>
        </div>
      </div>
    )
  }

  // Get all debts from condo_income for all houses
  const { data: condoIncomeData } = await supabase
    .from("condo_income")
    .select("*")
    .eq("condo_id", condoId)
    .neq("status", "approved")
  const condo_income = condoIncomeData || []

  console.log("[v0] Total debts found:", condo_income.length)
  console.log("[v0] Sample debt:", condo_income[0])
  if (condo_income.length > 0) {
    console.log("[v0] Fields in condo_income:", Object.keys(condo_income[0]))
  }

  // Calculate debts by house
  const housesDebts: HouseDebt[] = houses
    .map((house) => {
      const houseDebts = condo_income.filter((e) => e.house_id === house.id)

      const commonExpense = houseDebts
        .filter((e) => e.income_type === "common")
        .reduce((sum, e) => sum + (e.amount || 0), 0)
      const variableExpense = houseDebts
        .filter((e) => e.income_type === "variable")
        .reduce((sum, e) => sum + (e.amount || 0), 0)
      const finesCLP = houseDebts
        .filter((e) => e.income_type === "multa" && e.currency === "CLP")
        .reduce((sum, e) => sum + (e.amount || 0), 0)
      const finesUF = houseDebts
        .filter((e) => e.income_type === "multa" && e.currency === "UF")
        .reduce((sum, e) => sum + (e.amount || 0), 0)

      const totalDebt = commonExpense + variableExpense + finesCLP + finesUF

      return {
        houseId: house.id,
        houseNumber: `#${house.house_number || house.number || ""}`,
        ownerName: house.owner_name || "Sin propietario",
        commonExpense,
        variableExpense,
        finesCLP,
        finesUF,
        totalDebt,
      }
    })
    .filter((h) => h.totalDebt > 0)
    .sort((a, b) => b.totalDebt - a.totalDebt)

  if (housesDebts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Deudas Consolidadas</h1>
          <p className="text-muted-foreground">Visualiza las deudas de todas las casas</p>
        </div>
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-muted-foreground">No hay deudas pendientes</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Deudas Consolidadas</h1>
        <p className="text-muted-foreground">
          Visualiza y gestiona las deudas de todas las casas ({housesDebts.length})
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {housesDebts.map((debt) => (
          <Link
            key={debt.houseId}
            href={`/dashboard/deudas-consolidadas/${debt.houseId}`}
            className="group"
          >
            <div
              className="rounded-lg border p-4 transition-all hover:shadow-lg hover:border-red-300 cursor-pointer"
              style={{
                borderColor: debt.totalDebt > 0 ? "#ef4444" : "#10b981",
                backgroundColor: debt.totalDebt > 0 ? "#fef2f2" : "#f0fdf4",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: debt.totalDebt > 0 ? "#ef4444" : "#10b981" }}
                  >
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{debt.houseNumber}</p>
                    <p className="text-xs text-muted-foreground">{debt.ownerName}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>

              <div className="space-y-2 text-sm">
                {debt.commonExpense > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gasto Común:</span>
                    <span className="font-medium text-red-600">
                      {currencySymbol}
                      {debt.commonExpense.toLocaleString()}
                    </span>
                  </div>
                )}
                {debt.variableExpense > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gasto Variable:</span>
                    <span className="font-medium text-red-600">
                      {currencySymbol}
                      {debt.variableExpense.toLocaleString()}
                    </span>
                  </div>
                )}
                {(debt.finesCLP > 0 || debt.finesUF > 0) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Multas:</span>
                    <span className="font-medium text-red-600">
                      {debt.finesCLP > 0 ? `${currencySymbol}${debt.finesCLP.toLocaleString()}` : ""}
                      {debt.finesCLP > 0 && debt.finesUF > 0 ? " + " : ""}
                      {debt.finesUF > 0 ? `${debt.finesUF.toLocaleString()} UF` : ""}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-current border-opacity-10">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm">Total Deuda:</span>
                  <span
                    className="text-lg font-bold"
                    style={{ color: debt.totalDebt > 0 ? "#ef4444" : "#10b981" }}
                  >
                    {currencySymbol}
                    {debt.totalDebt.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
