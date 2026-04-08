import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SolicitudesClient } from './solicitudes-client'
import { getUserCondoId } from '@/lib/supabase/owner-utils'

export const metadata: Metadata = {
  title: 'Solicitudes de Materiales | Admin | Condominio',
  description: 'Gestión de solicitudes de materiales del conserje',
}

export default async function AdminSolicitudesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get condo_id
  const condoId = await getUserCondoId(supabase, user.id)

  if (!condoId) {
    return null
  }

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  // Check permissions
  const allowedRoles = ["admin", "super_admin", "conserje"]
  if (!profile?.role || !allowedRoles.includes(profile.role as string)) {
    return null
  }

  // Get material requests
  const { data: requests } = await supabase
    .from("material_requests")
    .select("*")
    .eq("condo_id", condoId)
    .order("created_at", { ascending: false })

  // Get staff (admins and conserjes) from profiles where condo_id matches
  const { data: staffProfiles } = await supabase
    .from("profiles")
    .select("id, name, role")
    .eq("condo_id", condoId)
    .in("role", ["admin", "super_admin", "conserje"])

  const staff = staffProfiles || []

  return (
    <SolicitudesClient
      condoId={condoId}
      solicitudes={requests || []}
      staff={staff}
      isAdmin={["admin", "super_admin"].includes(profile.role as string)}
      userRole={profile.role as string}
    />
  )
}
