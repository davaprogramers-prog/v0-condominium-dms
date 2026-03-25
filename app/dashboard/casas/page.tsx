import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CasasClient } from "./casas-client"

export default async function CasasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id, role")
    .eq("id", user.id)
    .single()

  if (!profile?.condo_id) {
    redirect("/dashboard")
  }

  const { data: houses } = await supabase
    .from("houses")
    .select("*")
    .eq("condo_id", profile.condo_id)
    .order("house_number")

  const { data: condo } = await supabase
    .from("condominiums")
    .select("currency_symbol")
    .eq("id", profile.condo_id)
    .maybeSingle()

  return (
    <CasasClient
      houses={houses || []}
      isAdmin={profile.role === "admin"}
      currencySymbol={condo?.currency_symbol || "$"}
    />
  )
}
