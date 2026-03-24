import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { EncuestasClient } from "./encuestas-client"

export default async function EncuestasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("condo_id, role").eq("id", user.id).single()
  if (!profile?.condo_id) redirect("/dashboard")

  const { data: surveys } = await supabase
    .from("surveys")
    .select("*, survey_options(*, survey_votes(*))")
    .eq("condo_id", profile.condo_id)
    .order("created_at", { ascending: false })

  const { data: houses } = await supabase
    .from("houses")
    .select("id")
    .eq("condo_id", profile.condo_id)

  return (
    <EncuestasClient
      surveys={surveys || []}
      userId={user.id}
      totalHouses={houses?.length || 0}
      isAdmin={profile.role === "admin"}
    />
  )
}
