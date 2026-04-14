'use server'

import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'
import { getSantiagoDateTime } from '@/lib/date-utils'

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
        console.log('[v0] Starting photo upload to Supabase...', { photoSize: data.receptionPhoto.byteLength, condoId: data.condo_id })
        
        // Convert ArrayBuffer to File for Supabase Storage
        const photoFile = new File([data.receptionPhoto], `reception-${Date.now()}.jpg`, { type: 'image/jpeg' })
        
        // Create file path: parcel-photos/{condoId}/{timestamp}.jpg
        const filename = `parcel-photos/${data.condo_id}/${uuidv4()}.jpg`
        console.log('[v0] Uploading to:', filename)
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('parcels')
          .upload(filename, photoFile, { upsert: true })
        
        if (uploadError) {
          throw new Error(`Upload error: ${uploadError.message}`)
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('parcels')
          .getPublicUrl(uploadData.path)
        
        photoUrl = urlData.publicUrl
        console.log('[v0] Photo uploaded to:', photoUrl)
      } catch (photoUploadError) {
        console.error('[v0] Error uploading photo:', photoUploadError)
        // Don't throw - parcel status update should continue even if photo upload fails
      }
    }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('parcels')
          .getPublicUrl(uploadData.path)
        
        reception_photo_url = urlData.publicUrl
        console.log('[v0] Photo uploaded successfully to:', reception_photo_url)
      } catch (photoUploadError) {
        console.error('[v0] ERROR uploading photo:', photoUploadError)
        // Don't throw - parcel creation should continue even if photo upload fails
      }
    }

    // Create parcel in database
    // Use UTC timestamp in ISO format - Supabase will store it as-is
    const utcNow = new Date().toISOString().split('.')[0]  // YYYY-MM-DDTHH:MM:SS format
    
    const { data: parcel, error } = await supabase
      .from('parcels')
      .insert({
        condo_id: data.condo_id,
        house_id: data.house_id,
        from_sender: data.from,
        status: 'recibido',
        received_date: utcNow,
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
      .select('*')
      .eq('id', data.parcel_id)
      .single()

    if (!parcel || parcel.condo_id !== profile.condo_id) {
      throw new Error('Encomienda no encontrada')
    }

    // Upload photo if provided
    let photoUrl = null
    if (data.photo) {
      try {
        // Convert ArrayBuffer to File for Supabase Storage
        const photoFile = new File([data.photo], `${data.new_status}-${Date.now()}.jpg`, { type: 'image/jpeg' })
        
        // Create file path: parcel-photos/{condoId}/{parcelId}/{status}-{timestamp}.jpg
        const filename = `parcel-photos/${profile.condo_id}/${data.parcel_id}/${data.new_status}-${Date.now()}.jpg`
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('parcels')
          .upload(filename, photoFile, { upsert: true })
        
        if (uploadError) {
          throw new Error(`Upload error: ${uploadError.message}`)
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('parcels')
          .getPublicUrl(uploadData.path)
        
        photoUrl = urlData.publicUrl
        console.log('[v0] Photo uploaded to:', photoUrl)
      } catch (photoUploadError) {
        console.error('[v0] Error uploading photo:', photoUploadError)
        // Don't throw - parcel status update should continue even if photo upload fails
      }
    }

    // Update parcel status
    const updateData: any = {
      status: data.new_status === 'delivered' ? 'entregado' : 'devuelto',
    }

    if (data.new_status === 'delivered') {
      updateData.delivered_date = getSantiagoDateTime()
    } else if (data.new_status === 'returned') {
      if (data.return_reason) {
        updateData.return_reason = data.return_reason
      }
      updateData.returned_date = getSantiagoDateTime()
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

