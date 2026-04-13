import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserCondoId, getUserHouseId } from "@/lib/supabase/owner-utils"
import { DollarSign, FileText, TrendingUp } from "lucide-react"
import { PaymentUploadDialogThemedWrapper } from "./payment-upload-dialog-themed"
import { AvatarUpload } from "./avatar-upload"
import { type CondoTheme, DEFAULT_THEME } from "@/lib/theme-utils"

export default async function MiCasaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  console.log("[v0] MiCasaPage - userId:", user.id, "email:", user.email)

  const condoId = await getUserCondoId(supabase, user.id)
  const houseId = await getUserHouseId(supabase, user.id)

  console.log("[v0] MiCasaPage - condoId:", condoId, "houseId:", houseId)

  // Also check what's in profiles directly
  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, house_id, condo_id, role")
    .eq("id", user.id)
    .single()
  
  console.log("[v0] MiCasaPage - direct profile query:", profileData)

  if (!houseId) {
    console.log("[v0] No houseId found, redirecting to dashboard")
    redirect("/dashboard")
  }

  const { data: house } = await supabase
    .from("houses")
    .select("*")
    .eq("id", houseId)
    .single()

  let profile: any = null
  try {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("first_name, last_name, avatar_url")
      .eq("id", user.id)
      .single()

    if (profileData) {
      profile = profileData
    }
  } catch (e) {
    console.log("[v0] Could not fetch profile:", e)
  }

  let parameters: any = null
  try {
    const { data: paramsData } = await supabase
      .from("parameters")
      .select("current_month, current_year, payment_deadline_day")
      .eq("condo_id", condoId)
      .single()

    if (paramsData) {
      parameters = paramsData
    }
  } catch (e) {
    console.log("[v0] Could not fetch parameters:", e)
  }

  const { data: incomes } = await supabase
    .from("condo_income")
    .select("*")
    .eq("house_id", houseId)
    .order("income_date", { ascending: false })

  const { data: paymentProofs } = await supabase
    .from("payment_proofs")
    .select("*")
    .eq("house_id", houseId)

  const { data: condo } = await supabase
    .from("condominiums")
    .select("currency_symbol, currency_name")
    .eq("id", condoId)
    .single()

  const { data: themeData } = await supabase
    .from("condominium_themes")
    .select("*")
    .eq("condo_id", condoId)
    .single()

  const theme = themeData as CondoTheme | null
  const cardBgColor = theme?.enable_custom_theme ? theme.card_bg_color : DEFAULT_THEME.card_bg_color
  const cardTextColor = theme?.enable_custom_theme ? theme.card_text_color : DEFAULT_THEME.card_text_color
  const parameterBgColor = theme?.enable_custom_theme ? theme.parameter_bg_color : "#fef3c7"

  const currentMonthIncomes = incomes?.filter(i => {
    return i.period_month === parameters?.current_month && 
           i.period_year === parameters?.current_year
  }) || []

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
        <div className="flex items-center gap-4">
          <AvatarUpload 
            currentAvatarUrl={profile?.avatar_url || undefined}
            userName={`${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Usuario"}
          />
          <div>
            <h1 className="text-3xl font-bold">Mi Casa #{house?.house_number}</h1>
            <p className="text-muted-foreground">Bienvenido, {profile?.first_name}</p>
          </div>
        </div>
        <PaymentUploadDialogThemedWrapper 
          condoId={condoId} 
          houseId={houseId}
          currencySymbol={condo?.currency_symbol}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border-2 p-4" style={{ backgroundColor: cardBgColor, borderColor: "rgba(255,255,255,0.1)", color: cardTextColor }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs opacity-75">Gasto del Mes</p>
              <p className="text-lg font-bold">{condo?.currency_symbol}{totalDue}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border-2 p-4" style={{ backgroundColor: cardBgColor, borderColor: "rgba(255,255,255,0.1)", color: cardTextColor }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs opacity-75">Pagado</p>
              <p className="text-lg font-bold">{condo?.currency_symbol}{totalPaid}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border-2 p-4" style={{ 
          backgroundColor: cardBgColor, 
          borderColor: "rgba(255,255,255,0.1)",
          color: cardTextColor
        }}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg`} style={{ backgroundColor: balance > 0 ? "#dc2626" : "#16a34a" }}>
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs opacity-75">{balance > 0 ? "Deuda" : "Saldo pendiente"}</p>
              <p className="text-lg font-bold">
                {condo?.currency_symbol}{Math.abs(balance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Pagos */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Historial de Pagos - Mes Actual</h2>
        
        <div className="rounded-lg border-2" style={{ backgroundColor: cardBgColor, borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ backgroundColor: "rgba(255,255,255,0.05)", color: cardTextColor, borderColor: "rgba(255,255,255,0.1)" }}>
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
                    <tr key={income.id} className="border-b hover:opacity-80" style={{ backgroundColor: cardBgColor, color: cardTextColor, borderColor: "rgba(255,255,255,0.1)" }}>
                      <td className="px-6 py-3 font-medium">{income.description || "Gasto Común"}</td>
                      <td className="px-6 py-3">{condo?.currency_symbol}{income.amount}</td>
                      <td className="px-6 py-3">
                        {hasReceipt ? (
                          <span className="text-xs" style={{ color: "#000000" }}>
                            {proofs.length} comprobante(s)
                          </span>
                        ) : (
                          <span className="text-xs opacity-50">Sin comprobante</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium" style={{
                          backgroundColor: isApproved ? "#065f46" : hasReceipt ? "#78350f" : "#7f1d1d",
                          color: "#f1f5f9"
                        }}>
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
            <div className="p-6 text-center opacity-50" style={{ color: cardTextColor }}>
              No hay ingresos registrados para este mes
            </div>
          )}
        </div>
      </div>

      {/* Vencimiento */}
      <div className="rounded-lg border-2 p-4" style={{ backgroundColor: "#fef3c7", borderColor: "#78350f", color: "#000000" }}>
        <p className="text-sm">
          <span className="font-semibold">Fecha de Vencimiento:</span> {parameters?.payment_deadline_day} de cada mes
        </p>
      </div>
    </div>
  )
}
