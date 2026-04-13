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

  if (!profile || !profile.condo_id) {
    redirect("/dashboard")
  }

  const condoId = profile.condo_id
  const houseId = profile.house_id
  const role = profile.role
  const isAdmin = role === "admin" || role === "super_admin"
  const isConcierge = role === "conserje"
  
  // Determine if user is viewing as admin (all visits) or as owner (only their property)
  const isViewingAsAdmin = (isAdmin || isConcierge) && !houseId

  // Get all houses in the condo
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
    
    visits = allVisits || []
  } else if (houseId) {
    // Owners and admin+owners see only their property's visits
    const { data: userVisits } = await supabase
      .from("visits")
      .select("*, house:houses(house_number)")
      .eq("house_id", houseId)
      .eq("condo_id", condoId)
      .order("visit_date", { ascending: false })
    
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
