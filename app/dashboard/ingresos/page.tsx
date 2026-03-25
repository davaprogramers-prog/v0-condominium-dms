import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { IngresosClient } from "./ingresos-client"

export default async function IngresosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("condo_id, role").eq("id", user.id).single()
  if (!profile?.condo_id) redirect("/dashboard")

  const condoId = profile.condo_id

  const [{ data: payments }, { data: houses }, { data: condo }] = await Promise.all([
    supabase
      .from("payments")
      .select("*, houses(house_number)")
      .eq("condo_id", condoId)
      .order("created_at", { ascending: false }),
    supabase.from("houses").select("id, house_number").eq("condo_id", condoId).order("house_number"),
    supabase.from("condominiums").select("currency_symbol, common_expense_amount").eq("id", condoId).single(),
  ])

  return (
    <IngresosClient
      payments={payments || []}
      houses={houses || []}
      currencySymbol={condo?.currency_symbol || "$"}
      commonExpenseAmount={condo?.common_expense_amount || 0}
      isAdmin={profile.role === "admin"}
    />
  )
}
