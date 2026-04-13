'use server'

import { createClient } from '@/lib/supabase/server'
import { put } from '@vercel/blob'
import { v4 as uuidv4 } from 'uuid'

export async function createParcel(data: {
  condo_id: string
  house_id: string
  parcel_type: string
  from: string
  tracking: string
  recipient_name: string
  description: string
  receptionPhoto?: ArrayBuffer
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

    // Upload reception photo if provided
    let reception_photo_url = null
    if (data.receptionPhoto) {
      const filename = `parcels/${data.condo_id}/${uuidv4()}.jpg`
      const blob = new Blob([data.receptionPhoto], { type: 'image/jpeg' })
      const result = await put(filename, blob, {
        access: 'private',
        addRandomSuffix: false,
      })
      reception_photo_url = result.url
    }

    // Create parcel in database
    const { data: parcel, error } = await supabase
      .from('parcels')
      .insert({
        condo_id: data.condo_id,
        house_id: data.house_id,
        from: data.from,
        tracking: data.tracking,
        status: 'received',
        received_date: new Date().toISOString(),
        parcel_type: data.parcel_type,
        recipient_name: data.recipient_name,
        description: data.description,
        reception_photo_url: reception_photo_url,
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

export async function updateParcelStatus(parcelId: string, status: string, deliveryPhoto?: ArrayBuffer, returnReason?: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    // Verify parcel belongs to user's condo
    const { data: parcel } = await supabase
      .from('parcels')
      .select('condo_id')
      .eq('id', parcelId)
      .single()

    if (!parcel) throw new Error('Encomienda no encontrada')

    const { data: profile } = await supabase
      .from('profiles')
      .select('condo_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.condo_id !== parcel.condo_id) {
      throw new Error('No autorizado')
    }

    // Upload delivery photo if provided
    let delivery_photo_url = null
    if (deliveryPhoto) {
      const filename = `parcels/${parcel.condo_id}/${parcelId}/${status}.jpg`
      const blob = new Blob([deliveryPhoto], { type: 'image/jpeg' })
      const result = await put(filename, blob, {
        access: 'private',
        addRandomSuffix: false,
      })
      delivery_photo_url = result.url
    }

    // Update parcel
    const updateData: any = {
      status,
      delivered_by: user.id,
    }

    if (delivery_photo_url) {
      if (status === 'delivered') {
        updateData.delivery_photo_url = delivery_photo_url
      } else if (status === 'returned') {
        updateData.return_photo_url = delivery_photo_url
        updateData.return_reason = returnReason
      }
    }

    const { error } = await supabase
      .from('parcels')
      .update(updateData)
      .eq('id', parcelId)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  } catch (err) {
    console.error('[v0] Error updating parcel:', err)
    return { success: false, error: String(err) }
  }
}
