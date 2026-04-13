import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { VisitsAdminClient } from "./visits-admin-client"

export default async function VisitasAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, condo_id, role")
    .eq("id", user.id)
    .single()

  if (!profile?.condo_id) redirect("/dashboard")

  // Check permissions
  const isAdmin = profile.role === "admin" || profile.role === "super_admin"
  const isConcierge = profile.role === "conserje"
  const isOwner = profile.role === "propietario"

  if (!isAdmin && !isConcierge && !isOwner) {
    redirect("/dashboard")
  }

  let visits: any[] = []
  let houses: any[] = []

  if (isAdmin || isConcierge) {
    // Admin and Concierge see all visits in their condo
    const { data: allVisits } = await supabase
      .from("visits")
      .select("*, house:houses(id, house_number)")
      .eq("condo_id", profile.condo_id)
      .order("visit_date", { ascending: false })

    visits = allVisits || []

    // Get all houses in the condo
    const { data: allHouses } = await supabase
      .from("houses")
      .select("id, house_number")
      .eq("condo_id", profile.condo_id)
      .order("house_number", { ascending: true })

    houses = allHouses || []
  } else if (isOwner) {
    // Owners see visits within 2 days of their properties
    const today = new Date()
    const twoDaysLater = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)

    const { data: userHouses } = await supabase
      .from("houses")
      .select("id, house_number")
      .eq("condo_id", profile.condo_id)
      .eq("owner_id", user.id)

    if (userHouses && userHouses.length > 0) {
      const houseIds = userHouses.map((h) => h.id)

      const { data: ownerVisits } = await supabase
        .from("visits")
        .select("*, house:houses(id, house_number)")
        .in("house_id", houseIds)
        .eq("condo_id", profile.condo_id)
        .gte("visit_date", today.toISOString().split("T")[0])
        .lte("visit_date", twoDaysLater.toISOString().split("T")[0])
        .order("visit_date", { ascending: false })

      visits = ownerVisits || []
      houses = userHouses
    }
  }

  return (
    <VisitsAdminClient
      visits={visits}
      houses={houses}
      userRole={profile.role}
      condoId={profile.condo_id}
      userId={user.id}
    />
  )
}
