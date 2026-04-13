import { Metadata } from 'next'
import { ChevronLeft, Plus, Calendar, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VisitsList } from './visits-list'
import { CreateVisitDialog } from './create-visit-dialog'

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

  // Get all houses in the condo
  const { data: houses } = await supabase
    .from("houses")
    .select("id, house_number")
    .eq("condo_id", condoId)
    .order("house_number", { ascending: true })

  // Get visits based on role
  let visits = []
  if (isAdmin || isConcierge) {
    // Admins and conserjes see all visits in the condo
    const { data: allVisits } = await supabase
      .from("visits")
      .select("*, house:houses(house_number)")
      .eq("condo_id", condoId)
      .order("visit_date", { ascending: false })
    
    visits = allVisits || []
  } else if (houseId) {
    // Owners see only their property's visits
    const { data: userVisits } = await supabase
      .from("visits")
      .select("*, house:houses(house_number)")
      .eq("house_id", houseId)
      .eq("condo_id", condoId)
      .order("visit_date", { ascending: false })
    
    visits = userVisits || []
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-500" />
            {isAdmin || isConcierge ? "Visitas del Condominio" : "Mis Visitas"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin || isConcierge ? "Gestiona todas las visitas del condominio" : "Registra y gestiona las visitas a tu propiedad"}
          </p>
        </div>
        {houseId && <CreateVisitDialog houses={houses || []} houseId={houseId} />}
      </div>

      {/* Content */}
      <VisitsList visits={visits} />
    </div>
  )
}
