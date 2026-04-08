import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserCondoId, getUserHouseId } from "@/lib/supabase/owner-utils"
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function BalancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Get condo and house using utility functions to avoid RLS issues
  const condoId = await getUserCondoId(supabase, user.id)
  const houseId = await getUserHouseId(supabase, user.id)

  if (!houseId || !condoId) redirect("/dashboard/mi-casa")

  // Get current parameters
  const { data: parameters } = await supabase
    .from("parameters")
    .select("current_month, current_year, payment_deadline_day")
    .eq("condo_id", condoId)
    .single()

  // Get all incomes for this house (current month)
  const { data: incomes } = await supabase
    .from("condo_income")
    .select("*")
    .eq("house_id", houseId)
    .eq("period_month", parameters?.current_month)
    .eq("period_year", parameters?.current_year)
    .order("income_date", { ascending: false })

  // Get payment proofs
  const { data: paymentProofs } = await supabase
    .from("payment_proofs")
    .select("*")
    .eq("house_id", houseId)

  // Get condo info
  const { data: condo } = await supabase
    .from("condominiums")
    .select("currency_symbol, currency_name")
    .eq("id", condoId)
    .single()

  // Helper to check approved proofs
  const hasApprovedProof = (incomeId: string, incomeType: string) => {
    return paymentProofs?.some(p => {
      if (incomeType === 'fixed') {
        return p.fixed_income_id === incomeId && p.status === 'approved'
      } else {
        return p.variable_income_id === incomeId && p.status === 'approved'
      }
    }) || false
  }

  const totalDue = incomes?.reduce((acc, i) => acc + (i.amount || 0), 0) || 0
  const totalPaid = incomes
    ?.filter(i => hasApprovedProof(i.id, i.income_type))
    .reduce((acc, i) => acc + (i.amount || 0), 0) || 0
  const balance = totalDue - totalPaid

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mi Balance</h1>
        <p className="text-muted-foreground">Ver tu saldo y estado de cuenta</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total a Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {condo?.currency_symbol}{totalDue.toLocaleString("es-CL")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Mes {parameters?.current_month}/{parameters?.current_year}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Pagado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {condo?.currency_symbol}{totalPaid.toLocaleString("es-CL")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Aprobado</p>
          </CardContent>
        </Card>

        <Card className={balance > 0 ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className={`h-4 w-4 ${balance > 0 ? "text-red-600" : "text-green-600"}`} />
              {balance > 0 ? "Deuda" : "Saldo a Favor"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
              {condo?.currency_symbol}{Math.abs(balance).toLocaleString("es-CL")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Diferencia</p>
          </CardContent>
        </Card>
      </div>

      {/* Detalle de Gastos */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Gastos y Pagos</CardTitle>
          <CardDescription>Mes {parameters?.current_month}/{parameters?.current_year}</CardDescription>
        </CardHeader>
        <CardContent>
          {incomes && incomes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left font-semibold">Descripción</th>
                    <th className="px-4 py-2 text-right font-semibold">Monto</th>
                    <th className="px-4 py-2 text-left font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {incomes.map((income) => {
                    const isApproved = hasApprovedProof(income.id, income.income_type)
                    return (
                      <tr key={income.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{income.description || "Gasto Común"}</td>
                        <td className="px-4 py-3 text-right">{condo?.currency_symbol}{income.amount?.toLocaleString("es-CL")}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isApproved
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {isApproved ? "Pagado" : "Pendiente"}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>No hay gastos registrados para este mes</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aviso de Vencimiento */}
      <Card className="border-amber-300 bg-amber-50">
        <CardContent className="pt-6">
          <p className="text-sm">
            <span className="font-semibold">Fecha de Vencimiento:</span> {parameters?.payment_deadline_day} de cada mes
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
