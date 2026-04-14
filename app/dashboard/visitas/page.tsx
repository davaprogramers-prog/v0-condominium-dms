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

  console.log("[v0] Visitas page - user profile:", { userId: user.id, profile })

  if (!profile) {
    console.log("[v0] No profile found, redirecting")
    redirect("/dashboard")
  }

  // For conserje, allow access even if condo_id is null (we'll handle it)
  const condoId = profile.condo_id
  const houseId = profile.house_id
  const role = profile.role
  const isAdmin = role === "admin" || role === "super_admin"
  const isConcierge = role === "conserje"
  
  // If conserje without condo_id, redirect
  if (isConcierge && !condoId) {
    console.log("[v0] Concierge without condo_id, redirecting")
    redirect("/dashboard")
  }

  // Determine if user is viewing as admin (all visits) or as owner (only their property)
  const isViewingAsAdmin = (isAdmin || isConcierge) && !houseId
  console.log("[v0] Visitas logic:", { condoId, houseId, role, isAdmin, isConcierge, isViewingAsAdmin })
  const { data: houses } = await supabase
    .from("houses")
    .select("id, house_number")
    .eq("condo_id", condoId)
    .order("house_number", { ascending: true })

  // Get visits based on role
  let visits = []
  if (isViewingAsAdmin) {
    // Admins and conserjes see all visits in the condo
    const { data: allVisits } = await supabase
      .from("visits")
      .select("*, house:houses(house_number)")
      .eq("condo_id", condoId)
      .order("visit_date", { ascending: false })
    
    console.log("[v0] Admin view - fetched visits:", { condoId, count: allVisits?.length || 0 })
    visits = allVisits || []
  } else if (houseId) {
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

  return (
    <VisitasPageClient 
      initialVisits={visits}
      isViewingAsAdmin={isViewingAsAdmin}
      isAdmin={isAdmin}
      isConcierge={isConcierge}
      houseId={houseId}
      houses={houses || []}
      condoId={condoId}
    />
  )
}
