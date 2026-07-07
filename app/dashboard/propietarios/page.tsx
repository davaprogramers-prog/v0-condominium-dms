import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PropietariosClient } from "./propietarios-client"

export default async function PropietariosPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Get user profile with condo and role
  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id, role")
    .eq("id", user.id)
    .single()

  if (!profile?.condo_id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No tienes un condominio asignado.</p>
      </div>
    )
  }

  const isAdmin = profile.role === "admin" || profile.role === "super_admin"
  const condoId = profile.condo_id

  // Get condo currency
  const { data: condo } = await supabase
    .from("condominiums")
    .select("currency_symbol")
    .eq("id", condoId)
    .single()

  const currencySymbol = condo?.currency_symbol || "$"

  // Get parameters (income amounts)
  const { data: params } = await supabase
    .from("parameters")
    .select("*")
    .eq("condo_id", condoId)
    .single()

  const currentMonth = params?.current_month || new Date().getMonth() + 1
  const currentYear = params?.current_year || new Date().getFullYear()
  const fixedAmount = params?.fixed_income_amount || 0
  const variableAmount = params?.variable_income_amount || 0

  // Get all houses with their owners
  const { data: housesRaw } = await supabase
    .from("houses")
    .select("*")
    .eq("condo_id", condoId)

  // Sort houses numerically by house_number
  const houses = housesRaw?.sort((a, b) => {
    const numA = parseInt(a.house_number?.replace(/\D/g, '') || '0', 10)
    const numB = parseInt(b.house_number?.replace(/\D/g, '') || '0', 10)
    return numA - numB
  })

  // Get infractions (unpaid fines)
  const { data: infractions } = await supabase
    .from("infractions")
    .select("*")
    .eq("condo_id", condoId)
    .eq("is_paid", false)

  // Get payment proofs for current period
  const { data: paymentProofs } = await supabase
    .from("payment_proofs")
    .select("*")
    .eq("condo_id", condoId)
    .eq("period_month", currentMonth)
    .eq("period_year", currentYear)

  // Get existing income records for current period to check paid status
  // Only check income with status "approved" (paid)
  const { data: incomeRecords } = await supabase
    .from("condo_income")
    .select("house_id, income_type, amount, status")
    .eq("condo_id", condoId)
    .eq("period_month", currentMonth)
    .eq("period_year", currentYear)

  // Get active exemptions for this condo
  const { data: exemptions } = await supabase
    .from("exemptions")
    .select("house_id, fixed_percentage, variable_percentage, is_permanent, start_date, end_date")
    .eq("condo_id", condoId)

  // Build a reference date for the period being displayed (last day of the month)
  const periodEnd = new Date(currentYear, currentMonth, 0) // day 0 of next month = last day of current
  const periodStart = new Date(currentYear, currentMonth - 1, 1)

  // Map house_id -> { fixed, variable } exemption percentages (highest active value wins)
  const exemptionByHouse = new Map<string, { fixed: number; variable: number }>()
  for (const ex of exemptions || []) {
    const start = ex.start_date ? new Date(ex.start_date) : null
    const end = ex.end_date ? new Date(ex.end_date) : null
    // Exemption is active for the period if permanent, or its date range overlaps the period
    const startsInTime = !start || start <= periodEnd
    const endsInTime = ex.is_permanent || !end || end >= periodStart
    if (!startsInTime || !endsInTime) continue

    const current = exemptionByHouse.get(ex.house_id as string) || { fixed: 0, variable: 0 }
    exemptionByHouse.set(ex.house_id as string, {
      fixed: Math.max(current.fixed, Number(ex.fixed_percentage) || 0),
      variable: Math.max(current.variable, Number(ex.variable_percentage) || 0),
    })
  }

  // Build houses data with payment status
  const housesWithStatus = (houses || []).map(house => {
    const houseInfractions = (infractions || []).filter(inf => inf.house_id === house.id && inf.status !== "pagada")
    const totalFines = houseInfractions.reduce((sum, inf) => sum + (inf.fine_amount || 0), 0)
    
    // Get proofs separated by type
    const houseProofs = (paymentProofs || []).filter(p => p.house_id === house.id)
    const gastosProof = houseProofs.find(p => p.payment_type === "gastos_comunes" || !p.payment_type)
    const multasProof = houseProofs.find(p => p.payment_type === "multas")
    
    // Check if income was recorded AND APPROVED for this house
    // Handle multiple income_type naming conventions
    const fixedIncome = (incomeRecords || []).find(
      r => r.house_id === house.id && 
           (r.income_type === "fixed" || r.income_type === "gasto_comun" || r.income_type === "cuota") &&
           r.status === "approved"
    )
    const variableIncome = (incomeRecords || []).find(
      r => r.house_id === house.id && 
           (r.income_type === "variable" || r.income_type === "gasto_comun_variable") &&
           r.status === "approved"
    )
    
    const isPaidFixed = !!fixedIncome
    const isPaidVariable = !!variableIncome

    // Get exemptions for this house to calculate effective amounts
    const houseExemption = exemptionByHouse.get(house.id) || { fixed: 0, variable: 0 }
    const effectiveFixedAmount = Math.round(fixedAmount * (1 - houseExemption.fixed / 100))
    const effectiveVariableAmount = Math.round(variableAmount * (1 - houseExemption.variable / 100))

    // Determine if payment is complete based on effective amounts
    // If a type of expense is 100% exempted, it doesn't need payment
    // Only non-exempted amounts need to be paid
    const needsFixedPayment = effectiveFixedAmount > 0
    const needsVariablePayment = effectiveVariableAmount > 0
    
    const isPaidComplete = 
      (!needsFixedPayment || isPaidFixed) &&
      (!needsVariablePayment || isPaidVariable)

    return {
      ...house,
      infractions: houseInfractions,
      totalFines,
      paymentProof: gastosProof, // Main proof for gastos comunes
      finesProof: multasProof, // Separate proof for fines
      isPaidFixed,
      isPaidVariable,
      isPaidComplete,
      effectiveFixedAmount,
      effectiveVariableAmount,
      houseExemption,
    }
  })

  return (
    <PropietariosClient
      houses={housesWithStatus}
      condoId={condoId}
      isAdmin={isAdmin}
      currentMonth={currentMonth}
      currentYear={currentYear}
      fixedAmount={fixedAmount}
      variableAmount={variableAmount}
      currencySymbol={currencySymbol}
    />
  )
}
