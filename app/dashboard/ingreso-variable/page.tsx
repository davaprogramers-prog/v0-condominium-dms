import { createClient } from "@/lib/supabase/server"
import { getCondoIncome } from "../ingresos/actions"
import { IngresoVariableClient } from "./ingreso-variable-client"
import { redirect } from "next/navigation"
import { getUserCondoId } from "@/lib/supabase/owner-utils"

export default async function IngresoVariablePage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; año?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Get condo_id using the helper function (works for both owners and admins)
  const condoId = await getUserCondoId(supabase, user.id)

  if (!condoId) {
    redirect("/dashboard")
  }

  const params = await searchParams
  const { mes = "3", año = "2026" } = params
  const monthIndex = parseInt(mes) - 1
  const currentDate = new Date(parseInt(año), monthIndex)
  const monthName = currentDate.toLocaleDateString("es-CL", { month: "long", year: "numeric" })

  // Fetch variable income for the selected month
  const { data: variableIncome } = await getCondoIncome(supabase, condoId, monthIndex, parseInt(año))

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"

  return (
    <IngresoVariableClient 
      incomes={variableIncome || []}
      currencySymbol="$"
      isAdmin={isAdmin}
    />
  )
}
