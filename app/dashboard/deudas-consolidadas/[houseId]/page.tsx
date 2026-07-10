import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DebtPaymentContainer } from "./debt-payment-container"

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
    .select("*")
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

  // Get all debts for this house from condo_income
  // Filter in code: show debts that are pending OR approved without receipt_url (unpaid)
  const { data: debtsData } = await supabase
    .from("condo_income")
    .select("*")
    .eq("condo_id", condoId)
    .eq("house_id", houseId)
    .order("created_at", { ascending: false })
  
  // Filter to show only unpaid debts: status != "approved" OR (status == "approved" AND no receipt_url)
  const debts = (debtsData || []).filter(
    (item) => item.status !== "approved" || (item.status === "approved" && !item.receipt_url)
  )

  const { data: paymentProofsData } = await supabase
    .from("payment_proofs")
    .select("*")
    .eq("house_id", houseId)
    .order("created_at", { ascending: false })
  const paymentProofs = paymentProofsData || []

  // Calculate totals
  const commonTotal = debts
    .filter((d) => d.income_type === "fixed")
    .reduce((sum, e) => sum + (e.amount || 0), 0)
  const variableTotal = debts
    .filter((d) => d.income_type === "variable")
    .reduce((sum, e) => sum + (e.amount || 0), 0)
  const finesCLP = debts
    .filter((d) => d.income_type === "multa" && d.currency === "CLP")
    .reduce((sum, e) => sum + (e.amount || 0), 0)
  const finesUF = debts
    .filter((d) => d.income_type === "multa" && d.currency === "UF")
    .reduce((sum, e) => sum + (e.amount || 0), 0)
  const totalDebt = commonTotal + variableTotal + finesCLP + finesUF

  const ownerName = house.owner_name || "Sin propietario"

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
        <h1 className="text-3xl font-bold">Casa #{house.house_number || house.number}</h1>
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
      <DebtPaymentContainer
        debts={debts}
        currencySymbol={currencySymbol}
        houseId={houseId}
        houseName={`Casa #${house.house_number || house.number}`}
        totalDebt={totalDebt}
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
  )
}
