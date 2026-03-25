import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { EncuestasClient } from "./encuestas-client"

export default async function EncuestasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id, role, house_id")
    .eq("id", user.id)
    .single()
  
  if (!profile?.condo_id) redirect("/dashboard")

  // Get surveys with options and votes
  const { data: surveys } = await supabase
    .from("surveys")
    .select(`
      *,
      survey_options (
        id,
        option_text,
        display_order,
        survey_votes (
          id,
          user_id
        )
      )
    `)
    .eq("condo_id", profile.condo_id)
    .order("created_at", { ascending: false })

  // Get total houses count
  const { count: totalHouses } = await supabase
    .from("houses")
    .select("*", { count: "exact", head: true })
    .eq("condo_id", profile.condo_id)

  const isAdmin = profile.role === "admin"

  return (
    <EncuestasClient
      surveys={surveys || []}
      userId={user.id}
      totalHouses={totalHouses || 0}
      isAdmin={isAdmin}
    />
  )
}
