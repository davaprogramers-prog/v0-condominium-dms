import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CartolasClient } from "./cartolas-client"

export default async function CartolasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("condo_id, role").eq("id", user.id).single()
  if (!profile?.condo_id) redirect("/dashboard")

  const { data: statements } = await supabase
    .from("bank_statements")
    .select("*")
    .eq("condo_id", profile.condo_id)
    .order("statement_date", { ascending: false })

  return (
    <CartolasClient
      statements={statements || []}
      isAdmin={profile.role === "admin" || profile.role === "super_admin"}
    />
  )
}
