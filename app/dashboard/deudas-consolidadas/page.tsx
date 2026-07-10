import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserCondoId } from "@/lib/supabase/owner-utils"
import { DeudasConsolidadasClient } from "./deudas-consolidadas-client"
import { type CondoTheme, DEFAULT_THEME } from "@/lib/theme-utils"

export default async function DeudasConsolidadasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Get condo_id using the helper function (works for both owners and admins)
  const condoId = await getUserCondoId(supabase, user.id)

  if (!condoId) {
    redirect("/dashboard")
  }

  // Get user role to check if is admin/super_admin
  const { data: userCondo } = await supabase
    .from("condo_users")
    .select("role")
    .eq("user_id", user.id)
    .eq("condo_id", condoId)
    .single()

  // Only admin and super_admin can access
  if (!userCondo || (userCondo.role !== "admin" && userCondo.role !== "super_admin")) {
    redirect("/dashboard")
  }

  // Get the condo theme
  const { data: condo } = await supabase
    .from("condominiums")
    .select("*")
    .eq("id", condoId)
    .single()

  const theme = condo?.theme ? JSON.parse(condo.theme) : DEFAULT_THEME

  return (
    <DeudasConsolidadasClient
      condoId={condoId}
      userId={user.id}
      theme={theme}
      currencySymbol={condo?.currency_symbol || "$"}
    />
  )
}
