// Mis Reservas Page - Reservation management for residents
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserCondoId, getUserHouseId } from "@/lib/supabase/owner-utils"
import { MisReservasClient } from "./mis-reservas-client"

export default async function MisReservasPage() {
  const supabase = await createClient()
  const serviceClient = createServiceClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const condoId = await getUserCondoId(supabase, user.id, user.email || undefined)
  const houseId = await getUserHouseId(supabase, user.id, user.email || undefined)

  if (!condoId) redirect("/dashboard")

  // Get user profile for role check
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const isAdminOrConcierge = profile?.role === "admin" || profile?.role === "super_admin" || profile?.role === "conserje"

  // Get reservable areas for this condo
  const { data: areas } = await supabase
    .from("common_areas")
    .select("*")
    .eq("condo_id", condoId)
    .eq("is_reservable", true)
    .order("name")

  // Get user's reservations (or all if admin) - use service client to bypass RLS
  const today = new Date().toISOString().split("T")[0]
  
  let reservationsQuery = serviceClient
    .from("area_reservations")
    .select(`
      *,
      common_areas(name, photo_url, max_hours_per_reservation, min_hours_to_modify, reception_time_minutes, delivery_time_minutes, opening_time, closing_time),
      houses(house_number)
    `)
    .eq("condo_id", condoId)
    .in("status", ["confirmed", "pending", "rejected"])
    .gte("reservation_date", today)
    .order("reservation_date", { ascending: true })
    .order("start_time", { ascending: true })

  if (!isAdminOrConcierge && houseId) {
    reservationsQuery = reservationsQuery.eq("house_id", houseId)
  }

  const { data: reservations } = await reservationsQuery

  // Get house info
  let house = null
  if (houseId) {
    const { data: houseData } = await supabase
      .from("houses")
      .select("id, house_number")
      .eq("id", houseId)
      .single()
    house = houseData
  }

  // Get all houses if admin (for changing reservation house)
  let allHouses: { id: string; house_number: string }[] = []
  if (isAdminOrConcierge) {
    const { data: housesData } = await supabase
      .from("houses")
      .select("id, house_number")
      .eq("condo_id", condoId)
      .order("house_number")
    allHouses = housesData || []
  }

  return (
    <MisReservasClient
      areas={areas || []}
      reservations={reservations || []}
      house={house}
      houseId={houseId}
      condoId={condoId}
      isAdminOrConcierge={isAdminOrConcierge}
      allHouses={allHouses}
    />
  )
}
