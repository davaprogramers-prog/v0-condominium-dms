import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserCondoId } from "@/lib/supabase/owner-utils"
import { DeudasConsolidadasClient } from "./deudas-consolidadas-client"
import { type CondoTheme, DEFAULT_THEME } from "@/lib/theme-utils"

export default async function DeudasConsolidadasPage() {
  const supabase = createClient()
  
  // Get current user first
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (!user || userError) {
    redirect("/auth/login")
  }

  // Get condo_id for the user
  const condoId = await getUserCondoId(supabase, user.id, user.email)
  
  if (!condoId) {
    redirect("/auth/login")
  }

  // Get user role to check if is admin/super_admin
  const { data: userCondo } = await supabase
    .from("condo_users")
    .select("role")
    .eq("user_id", user?.user?.id)
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
        condoId={condoId}
        userId={userId}
      />
    </div>
  )
}
