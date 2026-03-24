import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GastosClient } from "./gastos-client"

export default async function GastosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("condo_id, role").eq("id", user.id).single()
  if (!profile?.condo_id) redirect("/dashboard")

  const [{ data: expenses }, { data: expenseTypes }, { data: condo }] = await Promise.all([
    supabase
      .from("expenses")
      .select("*, expense_types(name)")
      .eq("condo_id", profile.condo_id)
      .order("expense_date", { ascending: false }),
    supabase.from("expense_types").select("*").eq("condo_id", profile.condo_id).eq("is_active", true),
    supabase.from("condominiums").select("currency_symbol").eq("id", profile.condo_id).single(),
  ])

  return (
    <GastosClient
      expenses={expenses || []}
      expenseTypes={expenseTypes || []}
      currencySymbol={condo?.currency_symbol || "$"}
      isAdmin={profile.role === "admin"}
    />
  )
}
