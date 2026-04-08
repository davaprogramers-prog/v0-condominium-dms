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

  // Get staff (admins and conserjes) from user_condos
  const { data: staffRelations } = await supabase
    .from("user_condos")
    .select("user_id, profiles(id, name, role)")
    .eq("condo_id", condoId)

  const staff = staffRelations
    ?.filter((rel: any) => rel.profiles && ['admin', 'super_admin', 'conserje'].includes(rel.profiles.role))
    .map((rel: any) => ({
      id: rel.profiles.id,
      name: rel.profiles.name,
      role: rel.profiles.role
    })) || []

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
