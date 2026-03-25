import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { IngresoVariableClient } from "./ingreso-variable-client"

export default async function IngresoVariablePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("condo_id, role").eq("id", user.id).single()
  if (!profile?.condo_id) redirect("/dashboard")

  const [{ data: incomes }, { data: condo }] = await Promise.all([
    supabase
      .from("variable_income")
      .select("*")
      .eq("condo_id", profile.condo_id)
      .order("income_date", { ascending: false }),
    supabase.from("condominiums").select("currency_symbol").eq("id", profile.condo_id).single(),
  ])

  return (
    <IngresoVariableClient
      incomes={incomes || []}
      currencySymbol={condo?.currency_symbol || "$"}
      isAdmin={profile.role === "admin"}
    />
  )
}
