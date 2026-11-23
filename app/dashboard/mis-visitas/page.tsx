import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserHouseId, getUserCondoId } from '@/lib/supabase/owner-utils'
import MisVisitasClient from './mis-visitas-client'

export const metadata: Metadata = {
  title: 'Mis Visitas | Condominio',
  description: 'Registra y gestiona las visitas a tu propiedad',
}

export default async function MisVisitasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const condoId = await getUserCondoId(supabase, user.id, user.email || undefined)
  const houseId = await getUserHouseId(supabase, user.id, user.email || undefined)

  if (!houseId || !condoId) {
    redirect("/dashboard")
  }

  // Get house info
  const { data: house } = await supabase
    .from("houses")
    .select("id, house_number")
    .eq("id", houseId)
    .single()

  // Get visits for this house only
  const { data: visits } = await supabase
    .from("visits")
    .select("*")
    .eq("house_id", houseId)
    .eq("condo_id", condoId)
    .order("visit_date", { ascending: false })

  // La tabla visits no guarda estado: una visita de días anteriores se considera realizada.
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(new Date())
  const visitasConEstado = (visits || []).map((v) => ({
    ...v,
    status: v.status ?? (String(v.visit_date).slice(0, 10) < hoy ? "completed" : "scheduled"),
  }))

  return (
    <MisVisitasClient 
      visits={visitasConEstado}
      houseId={houseId}
      condoId={condoId}
      houseNumber={house?.house_number || ""}
    />
  )
}
