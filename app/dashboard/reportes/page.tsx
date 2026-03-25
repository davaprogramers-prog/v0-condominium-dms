import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ReportesClient } from "./reportes-client"

export default async function ReportesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  const { data: profile } = await supabase.from("profiles").select("condo_id").eq("id", user.id).single()
  if (!profile?.condo_id) redirect("/dashboard")

  const [{ data: expenses }, { data: expenseTypes }, { data: condo }] = await Promise.all([
    supabase.from("expenses").select("*, expense_types(name)").eq("condo_id", profile.condo_id).order("expense_date"),
    supabase.from("expense_types").select("*").eq("condo_id", profile.condo_id),
    supabase.from("condominiums").select("currency_symbol").eq("id", profile.condo_id).single(),
  ])

  return <ReportesClient expenses={expenses || []} expenseTypes={expenseTypes || []} currencySymbol={condo?.currency_symbol || "$"} />
}
