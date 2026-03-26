import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ArriendosClient } from "./arriendos-client"

export default async function ArriendosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("condo_id, role").eq("id", user.id).single()
  if (!profile?.condo_id) redirect("/dashboard")

  const { data: condo } = await supabase.from("condominiums").select("currency_symbol").eq("id", profile.condo_id).single()

  const { data: rentals } = await supabase
    .from("rentals")
    .select("*")
    .eq("condo_id", profile.condo_id)
    .order("created_at", { ascending: false })

  return (
    <ArriendosClient
      rentals={rentals || []}
      currencySymbol={(condo?.currency_symbol as string) || "$"}
      isAdmin={profile.role === "admin" || profile.role === "super_admin"}
    />
  )
}
