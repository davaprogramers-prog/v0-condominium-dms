// Gestión de Reservas - Admin/Conserje page for managing all condo reservations
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserCondoId } from "@/lib/supabase/owner-utils"
import { GestionReservasClient } from "./gestion-reservas-client"

export default async function GestionReservasPage() {
  const supabase = await createClient()
  const serviceClient = createServiceClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const condoId = await getUserCondoId(supabase, user.id, user.email || undefined)
  if (!condoId) redirect("/dashboard")

  // Get user profile for role check
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const isAdminOrConcierge = profile?.role === "admin" || profile?.role === "super_admin" || profile?.role === "conserje"
  
  // Only admin/conserje can access this page
  if (!isAdminOrConcierge) {
    redirect("/dashboard/mis-reservas")
  }

  // Get reservable areas for this condo
  const { data: areas } = await supabase
    .from("common_areas")
    .select("*")
    .eq("condo_id", condoId)
    .eq("is_reservable", true)
    .order("name")

  // Get ALL reservations for the condo (past and future) - use service client to bypass RLS
  const { data: reservations, error: reservationsError } = await serviceClient
    .from("area_reservations")
    .select(`
      *,
      common_areas(name, photo_url, max_hours_per_reservation, min_hours_to_modify, reception_time_minutes, delivery_time_minutes, opening_time, closing_time),
      houses(house_number)
    `)
    .eq("condo_id", condoId)
    .order("reservation_date", { ascending: false })
    .order("start_time", { ascending: true })

  // Get all houses for filtering and editing
  const { data: allHouses } = await supabase
    .from("houses")
    .select("id, house_number")
    .eq("condo_id", condoId)
    .order("house_number")

  return (
    <GestionReservasClient
      areas={areas || []}
      reservations={reservations || []}
      allHouses={allHouses || []}
      condoId={condoId}
    />
  )
}
