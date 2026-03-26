import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DollarSign, FileText, TrendingUp } from "lucide-react"
import { PaymentUploadDialog } from "./payment-upload-dialog"

export default async function MiCasaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id, role, house_id, first_name")
    .eq("id", user.id)
    .single()

  // Propietarios deben tener house_id (cualquier usuario que no sea admin/super_admin)
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"
  if (!profile?.house_id && !isAdmin) {
    redirect("/dashboard")
  }
  
  // Si es admin sin house_id, mostrar mensaje
  if (!profile?.house_id) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Mi Casa</h1>
        <p className="text-muted-foreground">Esta página es para propietarios con una casa asignada.</p>
      </div>
    )
  }

  const { data: house } = await supabase
    .from("houses")
    .select("*")
    .eq("id", profile.house_id)
    .single()

  const { data: parameters } = await supabase
    .from("parameters")
    .select("current_month, current_year, payment_deadline_day")
    .eq("condo_id", profile.condo_id)
    .single()

  // Get incomes without the problematic join (payment_proofs has two FK to condo_income)
  const { data: incomes } = await supabase
    .from("condo_income")
    .select("*")
    .eq("house_id", profile.house_id)
    .order("income_date", { ascending: false })

  // Get payment proofs separately
  const { data: paymentProofs } = await supabase
    .from("payment_proofs")
    .select("*")
    .eq("house_id", profile.house_id)

  const { data: condo } = await supabase
    .from("condominiums")
    .select("currency_symbol, currency_name")
    .eq("id", profile.condo_id)
    .single()

  // Calcular información de deuda - filtrar por mes/año actual
  const currentMonthIncomes = incomes?.filter(i => {
    return i.period_month === parameters?.current_month && 
           i.period_year === parameters?.current_year
  }) || []

  // Create a helper to check if income has approved proof
  const hasApprovedProof = (incomeId: string, incomeType: string) => {
    return paymentProofs?.some(p => {
      if (incomeType === 'fixed') {
        return p.fixed_income_id === incomeId && p.status === 'approved'
      } else {
        return p.variable_income_id === incomeId && p.status === 'approved'
      }
    }) || false
  }

  const getProofsForIncome = (incomeId: string, incomeType: string) => {
    return paymentProofs?.filter(p => {
      if (incomeType === 'fixed') {
        return p.fixed_income_id === incomeId
      } else {
        return p.variable_income_id === incomeId
      }
    }) || []
  }

  const totalDue = currentMonthIncomes.reduce((acc, i) => acc + (i.amount || 0), 0)
  const totalPaid = currentMonthIncomes
    .filter(i => hasApprovedProof(i.id, i.income_type))
    .reduce((acc, i) => acc + (i.amount || 0), 0)
  const balance = totalDue - totalPaid

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mi Casa #{house?.house_number}</h1>
          <p className="text-muted-foreground">Bienvenido, {profile?.first_name}</p>
        </div>
        <PaymentUploadDialog 
          condoId={profile.condo_id} 
          houseId={profile.house_id}
          currencySymbol={condo?.currency_symbol}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <DollarSign className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gasto del Mes</p>
              <p className="text-lg font-bold">{condo?.currency_symbol}{totalDue}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <FileText className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pagado</p>
              <p className="text-lg font-bold">{condo?.currency_symbol}{totalPaid}</p>
            </div>
          </div>
        </div>

        <div className={`rounded-lg border bg-card p-4 ${balance > 0 ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${balance > 0 ? "bg-red-100" : "bg-green-100"}`}>
              <TrendingUp className={`h-5 w-5 ${balance > 0 ? "text-red-700" : "text-green-700"}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{balance > 0 ? "Deuda" : "Saldo"}</p>
              <p className={`text-lg font-bold ${balance > 0 ? "text-red-700" : "text-green-700"}`}>
                {condo?.currency_symbol}{Math.abs(balance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Pagos */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Historial de Pagos - Mes Actual</h2>
        
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left font-semibold">Tipo de Ingreso</th>
                  <th className="px-6 py-3 text-left font-semibold">Monto</th>
                  <th className="px-6 py-3 text-left font-semibold">Comprobantes</th>
                  <th className="px-6 py-3 text-left font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {currentMonthIncomes?.map((income) => {
                  const proofs = getProofsForIncome(income.id, income.income_type)
                  const hasReceipt = proofs.length > 0
                  const isApproved = hasApprovedProof(income.id, income.income_type)
                  
                  return (
                    <tr key={income.id} className="border-b hover:bg-muted/50">
                      <td className="px-6 py-3 font-medium">{income.description || "Gasto Común"}</td>
                      <td className="px-6 py-3">{condo?.currency_symbol}{income.amount}</td>
                      <td className="px-6 py-3">
                        {hasReceipt ? (
                          <span className="text-xs text-blue-600">
                            {proofs.length} comprobante(s)
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin comprobante</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          isApproved 
                            ? "bg-green-100 text-green-700" 
                            : hasReceipt 
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {isApproved ? "Aprobado" : hasReceipt ? "En Revisión" : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {!currentMonthIncomes?.length && (
            <div className="p-6 text-center text-muted-foreground">
              No hay ingresos registrados para este mes
            </div>
          )}
        </div>
      </div>

      {/* Vencimiento */}
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
        <p className="text-sm">
          <span className="font-semibold">Fecha de Vencimiento:</span> {parameters?.payment_deadline_day} de cada mes
        </p>
      </div>
    </div>
  )
}
