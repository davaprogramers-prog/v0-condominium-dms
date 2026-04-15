import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserHouseId, getUserCondoId } from '@/lib/supabase/owner-utils'
import MisEncomiendasClient from './mis-encomiendas-client'

export const metadata: Metadata = {
  title: 'Mis Encomiendas | Condominio',
  description: 'Ve las encomiendas pendientes de tu propiedad',
}

export default async function MisEncomiendasPage() {
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

  // Get parcels for this house - show pending (recibido) and recent delivered
  const { data: parcels } = await supabase
    .from("parcels")
    .select(`
      id,
      parcel_type,
      sender,
      tracking_number,
      status,
      received_at,
      delivered_at,
      notes,
      reception_photo_url,
      delivery_photo_url,
      received_by
    `)
    .eq("house_id", houseId)
    .eq("condo_id", condoId)
    .order("received_at", { ascending: false })

  // Get photo counts for each parcel
  const parcelIds = (parcels || []).map(p => p.id)
  let photoCounts: Record<string, number> = {}
  
  if (parcelIds.length > 0) {
    const { data: photos } = await supabase
      .from("parcel_photos")
      .select("parcel_id")
      .in("parcel_id", parcelIds)
    
    if (photos) {
      photos.forEach(photo => {
        photoCounts[photo.parcel_id] = (photoCounts[photo.parcel_id] || 0) + 1
      })
    }
  }

  return (
    <MisEncomiendasClient 
      parcels={parcels || []}
      photoCounts={photoCounts}
      houseId={houseId}
      condoId={condoId}
      houseNumber={house?.house_number || ""}
    />
  )
}
