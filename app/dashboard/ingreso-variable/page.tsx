import { createClient } from "@/lib/supabase/server"
import { getCondoIncome, getHouses } from "../ingresos/actions"
import { IngresoVariableClient } from "./ingreso-variable-client"

export default async function IngresoVariablePage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; año?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id, role")
    .eq("id", user?.id)
    .single()

  const condoId = profile?.condo_id
  const isAdmin = profile?.role === "admin"

  // Get period from query params or use current month
  const params = await searchParams
  const now = new Date()
  const year = parseInt(params.año as string) || now.getFullYear()
  const month = parseInt(params.mes as string) || now.getMonth() + 1

  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // Get income variables (filter for "variable" type) and houses
  let allIncome: any[] = []
  let variableIncome: any[] = []

  if (condoId) {
    allIncome = await getCondoIncome(condoId, year, month)
    variableIncome = allIncome.filter((inc) => inc.income_type === "variable")
  }

  return (
    <IngresoVariableClient 
      incomes={variableIncome}
      currencySymbol="$"
      isAdmin={isAdmin}
    />
  )
}


