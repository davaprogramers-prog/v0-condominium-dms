import { Metadata } from 'next'
import { Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VisitasPageClient from './visitas-client'

export const metadata: Metadata = {
  title: 'Mis Visitas | Condominio',
  description: 'Registra y gestiona las visitas a tu propiedad',
}

export default async function VisitasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, condo_id, house_id")
    .eq("id", user.id)
    .single()

  console.log("[v0] Visitas page - user profile:", { userId: user.id, role: profile?.role, condo_id: profile?.condo_id, house_id: profile?.house_id })

  if (!profile) {
    console.log("[v0] No profile found, redirecting")
    redirect("/dashboard")
  }

  let condoId = profile.condo_id
  const houseId = profile.house_id
  const role = profile.role
  const isAdmin = role === "admin" || role === "super_admin"
  const isConcierge = role === "conserje"
  
  // If conserje without condo_id, try to get it from the condos table
  // For now, if no condo_id, we'll show all condos' visits
  if (isConcierge && !condoId) {
    console.log("[v0] Concierge without condo_id, checking if needs assignment or showing all")
    // Don't redirect - let them see all visitas, or get from a default condo assignment
  }

  const isViewingAsAdmin = (isAdmin || isConcierge) && !houseId
  console.log("[v0] Visitas logic:", { condoId, houseId, role, isAdmin, isConcierge, isViewingAsAdmin })
  
  // Get visits - if condoId is null, get all visits (or could filter by assigned condos)
  let visits = []
  if (isViewingAsAdmin && condoId) {
    // Admins and conserjes with condo_id see all visits in that condo
    const { data: allVisits } = await supabase
      .from("visits")
      .select("*, house:houses(house_number)")
      .eq("condo_id", condoId)
      .order("visit_date", { ascending: false })
    
    console.log("[v0] Admin view - fetched visits for condo:", { condoId, count: allVisits?.length || 0 })
    visits = allVisits || []
  } else if (isViewingAsAdmin && !condoId) {
    // Conserje without condo_id assignment - get ALL visits from the system
    const { data: allVisits } = await supabase
      .from("visits")
      .select("*, house:houses(house_number)")
      .order("visit_date", { ascending: false })
    
    console.log("[v0] Admin view (no condo) - fetched ALL visits:", { count: allVisits?.length || 0 })
    visits = allVisits || []
  } else if (houseId && condoId) {
    // Owners and admin+owners see only their property's visits
    const { data: userVisits } = await supabase
      .from("visits")
      .select("*, house:houses(house_number)")
      .eq("house_id", houseId)
      .eq("condo_id", condoId)
      .order("visit_date", { ascending: false })
    
    console.log("[v0] Owner view - fetched visits:", { houseId, condoId, count: userVisits?.length || 0 })
    visits = userVisits || []
  }

  // Get houses list for filters
  let houses: any[] = []
  if (condoId) {
    const { data: housesData } = await supabase
      .from("houses")
      .select("id, house_number")
      .eq("condo_id", condoId)
      .order("house_number", { ascending: true })
    houses = housesData || []
  } else if (isViewingAsAdmin && !condoId) {
    // Get all houses from all condos if no condo_id assigned
    const { data: housesData } = await supabase
      .from("houses")
      .select("id, house_number")
      .order("house_number", { ascending: true })
    houses = housesData || []
  }

  return (
    <VisitasPageClient 
      initialVisits={visits}
      isViewingAsAdmin={isViewingAsAdmin}
      isAdmin={isAdmin}
      isConcierge={isConcierge}
      houseId={houseId}
      houses={houses}
      condoId={condoId}
    />
  )
}
