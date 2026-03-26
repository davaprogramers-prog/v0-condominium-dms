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
  const { data: houses } = await supabase
    .from("houses")
    .select("*")
    .eq("condo_id", condoId)
    .order("house_number")

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
  const { data: incomeRecords } = await supabase
    .from("condo_income")
    .select("house_id, income_type, amount")
    .eq("condo_id", condoId)
    .eq("period_month", currentMonth)
    .eq("period_year", currentYear)

  // Build houses data with payment status
  const housesWithStatus = (houses || []).map(house => {
    const houseInfractions = (infractions || []).filter(inf => inf.house_id === house.id && inf.status !== "pagada")
    const totalFines = houseInfractions.reduce((sum, inf) => sum + (inf.fine_amount || 0), 0)
    
    // Get proofs separated by type
    const houseProofs = (paymentProofs || []).filter(p => p.house_id === house.id)
    const gastosProof = houseProofs.find(p => p.payment_type === "gastos_comunes" || !p.payment_type)
    const multasProof = houseProofs.find(p => p.payment_type === "multas")
    
    // Check if income was recorded for this house
    const fixedIncome = (incomeRecords || []).find(
      r => r.house_id === house.id && r.income_type === "gasto_comun"
    )
    const variableIncome = (incomeRecords || []).find(
      r => r.house_id === house.id && r.income_type === "gasto_comun_variable"
    )
    
    const isPaidFixed = !!fixedIncome
    const isPaidVariable = !!variableIncome

    return {
      ...house,
      infractions: houseInfractions,
      totalFines,
      paymentProof: gastosProof, // Main proof for gastos comunes
      finesProof: multasProof, // Separate proof for fines
      isPaidFixed,
      isPaidVariable,
      isPaidComplete: isPaidFixed && isPaidVariable,
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
