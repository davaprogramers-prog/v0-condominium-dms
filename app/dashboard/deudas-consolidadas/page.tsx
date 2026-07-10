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

  // Get user role to check permissions
  const { data: userCondo } = await supabase
    .from("condo_users")
    .select("role")
    .eq("user_id", user.id)
    .eq("condo_id", condoId)
    .single()

  // Allow access for admins and super_admins
  // For now, allow any authenticated user from the condominium
  if (!userCondo) {
    // User is not in this condominium
    redirect("/dashboard")
  }

  // Get the condo theme
  const { data: condo } = await supabase
    .from("condominiums")
    .select("*")
    .eq("id", condoId)
    .single()

  const theme = condo?.theme ? JSON.parse(condo.theme) : DEFAULT_THEME

  // Get debts data
  const { data: debts = [] } = await supabase
    .from("resident_debts")
    .select("*")
    .eq("condo_id", condoId)

  // Pass admin status to client
  const isAdmin = userCondo?.role === "admin" || userCondo?.role === "super_admin"

  return (
    <DeudasConsolidadasClient
      debts={debts}
      condoId={condoId}
      userId={user.id}
      theme={theme}
      currencySymbol={condo?.currency_symbol || "$"}
      isAdmin={isAdmin}
    />
  )
}
