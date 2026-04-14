'use server'

import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'
import { getSantiagoDateTime } from '@/lib/date-utils'

export async function createParcel(data: {
  condo_id: string
  house_id: string
  parcel_type: string
  from: string
  receptionPhotoUrl?: string
}) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    // Verify user belongs to this condo and has permission
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, condo_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.condo_id !== data.condo_id) {
      throw new Error('No autorizado')
    }

    if (!['admin', 'super_admin', 'conserje'].includes(profile.role)) {
      throw new Error('Rol no autorizado')
    }

    // Create parcel in database with photo URL if provided
    const utcNow = new Date().toISOString().split('.')[0]
    
    const { data: parcel, error } = await supabase
      .from('parcels')
      .insert({
        condo_id: data.condo_id,
        house_id: data.house_id,
        from_sender: data.from,
        status: 'recibido',
        received_date: utcNow,
        parcel_type: data.parcel_type,
        reception_photo_url: data.receptionPhotoUrl || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, parcel }
  } catch (err) {
    console.error('[v0] Error creating parcel:', err)
    return { success: false, error: String(err) }
  }
}

export async function updateParcelStatus(data: {
  parcel_id: string
  new_status: 'entregado' | 'devuelto'
  return_reason?: string
  photoUrl?: string
}) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    // Verify user is conserje or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, condo_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin', 'conserje'].includes(profile.role)) {
      throw new Error('No autorizado')
    }

    // Get parcel to verify it belongs to the condo
    const { data: parcel } = await supabase
      .from('parcels')
      .select('*')
      .eq('id', data.parcel_id)
      .single()

    if (!parcel || parcel.condo_id !== profile.condo_id) {
      throw new Error('Encomienda no encontrada')
    }

    // Update parcel status and photo URLs
    const updateData: any = {
      status: data.new_status,
    }

    if (data.new_status === 'devuelto' && data.return_reason) {
      updateData.return_reason = data.return_reason
    }

    // Add delivery or return photo URL to update
    if (data.photoUrl) {
      if (data.new_status === 'entregado') {
        updateData.delivery_photo_url = data.photoUrl
      } else if (data.new_status === 'devuelto') {
        updateData.return_photo_url = data.photoUrl
      }
    }

    const { error } = await supabase
      .from('parcels')
      .update(updateData)
      .eq('id', data.parcel_id)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  } catch (err) {
    console.error('[v0] Error updating parcel status:', err)
    return { success: false, error: String(err) }
  }
}

export async function editParcelReception(data: {
  parcel_id: string
  parcel_type: string
  from: string
  house_id: string
}) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    // Verify user belongs to this condo
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, condo_id')
      .eq('id', user.id)
      .single()

    if (!profile) throw new Error('Perfil no encontrado')

    // Get parcel to verify it belongs to the condo and is still in "recibido" status
    const { data: parcel } = await supabase
      .from('parcels')
      .select('*')
      .eq('id', data.parcel_id)
      .single()

    if (!parcel || parcel.condo_id !== profile.condo_id) {
      throw new Error('Encomienda no encontrada')
    }

    if (parcel.status !== 'recibido') {
      throw new Error('Solo se pueden editar encomiendas en estado "recibido"')
    }

    // Update parcel fields
    const { error } = await supabase
      .from('parcels')
      .update({
        parcel_type: data.parcel_type,
        from_sender: data.from,
        house_id: data.house_id,
      })
      .eq('id', data.parcel_id)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  } catch (err) {
    console.error('[v0] Error editing parcel reception:', err)
    return { success: false, error: String(err) }
  }
}
