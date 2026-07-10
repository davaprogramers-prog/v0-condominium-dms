import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserCondoId, getUserHouseId } from "@/lib/supabase/owner-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, DollarSign, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DebtPaymentForm } from "./debt-payment-form"

interface DebtDetailPageProps {
  params: Promise<{ houseId: string }>
}

export default async function DebtDetailPage({ params }: DebtDetailPageProps) {
  const { houseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const condoId = await getUserCondoId(supabase, user.id)
  if (!condoId) redirect("/dashboard")

  // Verify user has access to this house
  const { data: houseResident } = await supabase
    .from("house_residents")
    .select("*")
    .eq("house_id", houseId)
    .eq("resident_id", user.id)
    .single()

  if (!houseResident) {
    redirect("/dashboard/mis-deudas")
  }

  // Get house details
  const { data: house } = await supabase
    .from("houses")
    .select("id, house_number, owner_name")
    .eq("id", houseId)
    .eq("condo_id", condoId)
    .single()

  if (!house) {
    redirect("/dashboard/mis-deudas")
  }

  // Get condo info
  const { data: condo } = await supabase
    .from("condominiums")
    .select("currency_symbol")
    .eq("id", condoId)
    .single()

  const currencySymbol = condo?.currency_symbol || "$"

  // Get common expenses
  const { data: commonExpensesData } = await supabase
    .from("condo_expenses")
    .select("*")
    .eq("condo_id", condoId)
    .eq("house_id", houseId)
    .eq("is_paid", false)
  const commonExpenses = commonExpensesData || []

  // Get variable expenses
  const { data: variableExpensesData } = await supabase
    .from("condo_income")
    .select("*")
    .eq("condo_id", condoId)
    .eq("house_id", houseId)
    .neq("income_type", "multa")
    .neq("status", "approved")
  const variableExpenses = variableExpensesData || []

  // Get infractions/fines
  const { data: infractionsData } = await supabase
    .from("infractions")
    .select("*")
    .eq("condo_id", condoId)
    .eq("house_id", houseId)
    .gt("amount_pending", 0)
  const infractions = infractionsData || []

  // Get payment proofs
  const { data: paymentProofsData } = await supabase
    .from("payment_proofs")
    .select("*")
    .eq("house_id", houseId)
    .order("created_at", { ascending: false })
  const paymentProofs = paymentProofsData || []

  // Calculate totals
  const commonExpenseTotal = commonExpenses.reduce((acc, e) => acc + (e.amount || 0), 0)
  const variableExpenseTotal = variableExpenses.reduce((acc, e) => acc + (e.amount || 0), 0)
  const finesClpTotal = infractions
    .filter((i) => i.currency === "CLP")
    .reduce((acc, i) => acc + (i.amount_pending || 0), 0)
  const finesUfTotal = infractions
    .filter((i) => i.currency === "UF")
    .reduce((acc, i) => acc + (i.amount_pending || 0), 0)

  const totalDebt = commonExpenseTotal + variableExpenseTotal + finesClpTotal

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/mis-deudas">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Casa #{house.house_number}</h1>
          <p className="text-muted-foreground">{house.owner_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Debt Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Debt Summary Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {commonExpenseTotal > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-900">Gasto Común</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-amber-900">
                    {currencySymbol}
                    {commonExpenseTotal.toLocaleString("es-CL")}
                  </p>
                </CardContent>
              </Card>
            )}
            {variableExpenseTotal > 0 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-900">Gasto Variable</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-900">
                    {currencySymbol}
                    {variableExpenseTotal.toLocaleString("es-CL")}
                  </p>
                </CardContent>
              </Card>
            )}
            {finesClpTotal > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-900">Multas CLP</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-900">
                    {currencySymbol}
                    {finesClpTotal.toLocaleString("es-CL")}
                  </p>
                </CardContent>
              </Card>
            )}
            {finesUfTotal > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-900">Multas UF</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-900">
                    {finesUfTotal.toFixed(2)} UF
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Total Debt Card */}
          <Card className="border-red-300 bg-gradient-to-br from-red-50 to-red-100">
            <CardHeader>
              <CardTitle className="text-red-900">Total Deuda Pendiente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-red-900">
                {currencySymbol}
                {totalDebt.toLocaleString("es-CL")}
              </p>
              {finesUfTotal > 0 && (
                <p className="text-sm text-red-700 mt-2">
                  Más {finesUfTotal.toFixed(2)} UF en multas
                </p>
              )}
            </CardContent>
          </Card>

          {/* Payment Proofs History */}
          {paymentProofs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historial de Pagos</CardTitle>
                <CardDescription>Comprobantes de pago enviados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentProofs.map((proof) => (
                    <div key={proof.id} className="flex items-start justify-between p-3 rounded-lg border bg-muted/50">
                      <div className="flex items-start gap-3">
                        <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium">
                            {currencySymbol}
                            {proof.amount?.toLocaleString("es-CL")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(proof.created_at).toLocaleDateString("es-CL")}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
                          proof.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : proof.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {proof.status === "approved" ? "Aprobado" : proof.status === "rejected" ? "Rechazado" : "Pendiente"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Payment Form Sidebar */}
        <div>
          <DebtPaymentForm
            houseId={houseId}
            houseNumber={house.house_number}
            totalDebt={totalDebt}
            currencySymbol={currencySymbol}
          />
        </div>
      </div>
    </div>
  )
}
