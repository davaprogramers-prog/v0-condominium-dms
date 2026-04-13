'use server'

import { createClient } from '@/lib/supabase/server'
import { put } from '@vercel/blob'
import { v4 as uuidv4 } from 'uuid'

export async function createParcel(data: {
  condo_id: string
  house_id: string
  parcel_type: string
  from: string
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
      try {
        const filename = `parcels/${data.condo_id}/${uuidv4()}.jpg`
        const blob = new Blob([data.receptionPhoto], { type: 'image/jpeg' })
        const result = await put(filename, blob, {
          access: 'public',
          addRandomSuffix: false,
        })
        reception_photo_url = result.url
        console.log('[v0] Photo uploaded successfully:', reception_photo_url)
      } catch (photoUploadError) {
        console.error('[v0] Error uploading photo to Blob:', photoUploadError)
        // Don't throw - continue without photo
      }
    }

    // Create parcel in database
    const { data: parcel, error } = await supabase
      .from('parcels')
      .insert({
        condo_id: data.condo_id,
        house_id: data.house_id,
        from_sender: data.from,
        status: 'recibido',
        received_date: new Date().toISOString(),
        parcel_type: data.parcel_type,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Save reception photo to parcel_photos table if provided
    if (reception_photo_url && parcel) {
      const { error: photoError } = await supabase
        .from('parcel_photos')
        .insert({
          parcel_id: parcel.id,
          photo_url: reception_photo_url,
          photo_type: 'recepcion_garita',
          uploaded_by: user.id,
        })

      if (photoError) {
        console.error('[v0] Error saving photo record:', photoError)
        // Don't throw - parcel was created successfully
      }
    }

    return { success: true, parcel }
  } catch (err) {
    console.error('[v0] Error creating parcel:', err)
    return { success: false, error: String(err) }
  }
}

export async function updateParcelStatus(data: {
  parcel_id: string
  new_status: 'delivered' | 'returned'
  return_reason?: string
  photo?: ArrayBuffer
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
      .select('id, condo_id')
      .eq('id', data.parcel_id)
      .single()

    if (!parcel || parcel.condo_id !== profile.condo_id) {
      throw new Error('Encomienda no encontrada')
    }

    // Upload photo if provided
    let photoUrl = null
    if (data.photo) {
      try {
        const filename = `parcels/${profile.condo_id}/${data.parcel_id}/${data.new_status}-${Date.now()}.jpg`
        const blob = new Blob([data.photo], { type: 'image/jpeg' })
        const result = await put(filename, blob, {
          access: 'public',
          addRandomSuffix: false,
        })
        photoUrl = result.url
        console.log('[v0] Photo uploaded successfully:', photoUrl)
      } catch (photoUploadError) {
        console.error('[v0] Error uploading photo to Blob:', photoUploadError)
        // Don't throw - continue without photo
      }
    }

    // Update parcel status
    const updateData: any = {
      status: data.new_status === 'delivered' ? 'entregado' : 'devuelto',
    }

    if (data.new_status === 'delivered') {
      updateData.delivered_date = new Date().toISOString()
    } else if (data.new_status === 'returned') {
      if (data.return_reason) {
        updateData.return_reason = data.return_reason
      }
      updateData.returned_date = new Date().toISOString()
    }

    const { error } = await supabase
      .from('parcels')
      .update(updateData)
      .eq('id', data.parcel_id)

    if (error) {
      throw new Error(error.message)
    }

    // Save delivery/return photo to parcel_photos table if provided
    if (photoUrl) {
      const photoType = data.new_status === 'delivered' ? 'entrega_propietario' : 'devolucion'
      
      const { error: photoError } = await supabase
        .from('parcel_photos')
        .insert({
          parcel_id: data.parcel_id,
          photo_url: photoUrl,
          photo_type: photoType,
          uploaded_by: user.id,
        })

      if (photoError) {
        console.error('[v0] Error saving photo record:', photoError)
        // Don't throw - parcel was updated successfully
      }
    }

    return { success: true }
  } catch (err) {
    console.error('[v0] Error updating parcel status:', err)
    return { success: false, error: String(err) }
  }
}
