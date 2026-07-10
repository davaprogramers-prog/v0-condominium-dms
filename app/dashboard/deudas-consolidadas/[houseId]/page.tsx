import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DebtPaymentForm } from "./debt-payment-form"

const DEFAULT_THEME = {
  primary_color: "#2563eb",
  secondary_color: "#1e40af",
  accent_color: "#f59e0b",
}

export default async function DebtDetailPage({
  params,
}: {
  params: Promise<{ houseId: string }>
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

  const isAdmin = profile.role === "admin" || profile.role === "super_admin"
  if (!isAdmin) {
    redirect("/dashboard")
  }

  const condoId = profile.condo_id
  const { houseId } = await params

  // Get house info
  const { data: house } = await supabase
    .from("houses")
    .select("id, number, owner_profile_id, profiles(first_name, last_name)")
    .eq("id", houseId)
    .eq("condo_id", condoId)
    .single()

  if (!house) {
    redirect("/dashboard/deudas-consolidadas")
  }

  // Get condo info for currency symbol
  const { data: condo } = await supabase
    .from("condominiums")
    .select("currency_symbol, theme")
    .eq("id", condoId)
    .single()

  const currencySymbol = condo?.currency_symbol || "$"
  const theme = condo?.theme ? JSON.parse(condo.theme) : DEFAULT_THEME

  // Get debts for this house
  const { data: commonExpensesData } = await supabase
    .from("condo_expenses")
    .select("*")
    .eq("condo_id", condoId)
    .eq("house_id", houseId)
    .eq("is_paid", false)
  const commonExpenses = commonExpensesData || []

  const { data: variableExpensesData } = await supabase
    .from("condo_income")
    .select("*")
    .eq("condo_id", condoId)
    .eq("house_id", houseId)
    .neq("status", "approved")
    .neq("income_type", "multa")
  const variableExpenses = variableExpensesData || []

  const { data: infractionsData } = await supabase
    .from("infractions")
    .select("*")
    .eq("condo_id", condoId)
    .eq("house_id", houseId)
    .gt("amount_pending", 0)
  const infractions = infractionsData || []

  const { data: paymentProofsData } = await supabase
    .from("payment_proofs")
    .select("*")
    .eq("house_id", houseId)
    .order("created_at", { ascending: false })
  const paymentProofs = paymentProofsData || []

  // Calculate totals
  const commonTotal = commonExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const variableTotal = variableExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const finesCLP = infractions
    .filter((i) => i.currency === "CLP")
    .reduce((sum, i) => sum + (i.amount_pending || 0), 0)
  const finesUF = infractions
    .filter((i) => i.currency === "UF")
    .reduce((sum, i) => sum + (i.amount_pending || 0), 0)
  const totalDebt = commonTotal + variableTotal + finesCLP + finesUF

  const ownerName =
    house.profiles && house.profiles.length > 0
      ? `${house.profiles[0].first_name || ""} ${house.profiles[0].last_name || ""}`.trim()
      : "Sin propietario"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/deudas-consolidadas"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a Deudas Consolidadas
        </Link>
        <h1 className="text-3xl font-bold">Casa #{house.number}</h1>
        <p className="text-muted-foreground">{ownerName}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Gasto Común</p>
          <p className="text-2xl font-bold" style={{ color: theme.primary_color }}>
            {currencySymbol}
            {commonTotal.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Gasto Variable</p>
          <p className="text-2xl font-bold" style={{ color: theme.accent_color }}>
            {currencySymbol}
            {variableTotal.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Multas</p>
          <p className="text-2xl font-bold text-red-600">
            {finesCLP > 0 ? `${currencySymbol}${finesCLP.toLocaleString()}` : "-"}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Deuda</p>
          <p className="text-3xl font-bold text-red-600">
            {currencySymbol}
            {totalDebt.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Debtails */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Deudas Details */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Desglose de Deudas</h2>

          {commonExpenses.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-semibold mb-3">Gastos Comunes ({commonExpenses.length})</h3>
              <div className="space-y-2 text-sm">
                {commonExpenses.map((expense, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-muted-foreground">{expense.description || "Gasto"}</span>
                    <span className="font-medium">
                      {currencySymbol}
                      {expense.amount?.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {variableExpenses.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-semibold mb-3">Gastos Variables ({variableExpenses.length})</h3>
              <div className="space-y-2 text-sm">
                {variableExpenses.map((expense, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {expense.description || "Gasto variable"}
                    </span>
                    <span className="font-medium">
                      {currencySymbol}
                      {expense.amount?.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {infractions.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-semibold mb-3 text-red-600">Multas ({infractions.length})</h3>
              <div className="space-y-2 text-sm">
                {infractions.map((fine, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-muted-foreground">{fine.description || "Multa"}</span>
                    <span className="font-medium text-red-600">
                      {fine.currency === "CLP" ? currencySymbol : ""}
                      {fine.amount_pending?.toLocaleString()}
                      {fine.currency === "UF" ? " UF" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Payment Form */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Informar Pago</h2>
          <DebtPaymentForm
            houseId={houseId}
            houseName={`Casa #${house.number}`}
            totalDebt={totalDebt}
            currencySymbol={currencySymbol}
          />

          {/* Payment History */}
          {paymentProofs.length > 0 && (
            <div className="rounded-lg border bg-card p-4 mt-6">
              <h3 className="font-semibold mb-3">Comprobantes de Pago</h3>
              <div className="space-y-2 text-sm">
                {paymentProofs.slice(0, 5).map((proof, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                    <div>
                      <p className="font-medium">
                        {currencySymbol}
                        {proof.amount?.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(proof.created_at).toLocaleDateString("es-CL")}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        proof.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : proof.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {proof.status === "approved"
                        ? "Aprobado"
                        : proof.status === "rejected"
                          ? "Rechazado"
                          : "Pendiente"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
