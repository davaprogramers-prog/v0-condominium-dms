import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserCondoId, getUserHouseId } from "@/lib/supabase/owner-utils"
import { MiCasaClient } from "./mi-casa-client"

export default async function MiCasaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const condoId = await getUserCondoId(supabase, user.id)
  const houseId = await getUserHouseId(supabase, user.id)

  if (!houseId) redirect("/dashboard")

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
    <MiCasaClient 
      house={house}
      profile={profile}
      condo={condo}
      condoId={condoId}
      houseId={houseId}
      parameters={parameters}
      currentMonthIncomes={currentMonthIncomes}
      paymentProofs={paymentProofs}
      totalDue={totalDue}
      totalPaid={totalPaid}
      balance={balance}
      hasApprovedProof={hasApprovedProof}
      getProofsForIncome={getProofsForIncome}
    />
  )
}
