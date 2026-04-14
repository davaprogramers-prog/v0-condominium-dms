'use server'

import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'
import { getSantiagoDateTime } from '@/lib/date-utils'

export async function createParcel(data: {
  condo_id: string
  house_id: string
  parcel_type: string
  from: string
  receptionPhoto?: number[]  // ArrayBuffer serialized as number array
  receptionPhotoFileName?: string
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

    // Upload reception photo if provided (using service role permissions)
    let receptionPhotoUrl: string | null = null
    if (data.receptionPhoto && data.receptionPhoto.length > 0) {
      try {
        console.log('[v0] Uploading photo from server with service role...', { photoSize: data.receptionPhoto.length })
        
        // Convert number array back to Buffer
        const photoBuffer = Buffer.from(data.receptionPhoto)
        
        // Create file path with original filename extension or jpg
        const ext = data.receptionPhotoFileName?.split('.').pop() || 'jpg'
        const filePath = `parcel-photos/${data.condo_id}/${Date.now()}.${ext}`
        
        console.log('[v0] Uploading to:', filePath)
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, photoBuffer, { upsert: true })

        if (uploadError) {
          throw new Error(`Upload error: ${uploadError.message}`)
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(uploadData.path)

        receptionPhotoUrl = urlData.publicUrl
        console.log('[v0] Photo uploaded successfully to:', receptionPhotoUrl)
      } catch (photoUploadError) {
        console.error('[v0] Error uploading photo:', photoUploadError)
        // Don't throw - parcel creation should continue even if photo upload fails
      }
    }

    // Create parcel in database
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
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Save reception photo to parcel_photos table if provided
    if (receptionPhotoUrl && parcel) {
      const { error: photoError } = await supabase
        .from('parcel_photos')
        .insert({
          parcel_id: parcel.id,
          photo_url: receptionPhotoUrl,
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
  new_status: 'entregado' | 'devuelto'
  return_reason?: string
  photoFile?: File
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

    // Upload delivery/return photo if provided
    let photoUrl: string | null = null
    if (data.photoFile) {
      try {
        console.log('[v0] Uploading delivery photo from server with service role...')
        
        const filePath = `parcel-photos/${profile.condo_id}/${data.parcel_id}/${data.new_status}-${Date.now()}.jpg`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, data.photoFile, { upsert: true })

        if (uploadError) {
          throw new Error(`Upload error: ${uploadError.message}`)
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(uploadData.path)

        photoUrl = urlData.publicUrl
        console.log('[v0] Delivery photo uploaded successfully to:', photoUrl)
      } catch (photoUploadError) {
        console.error('[v0] Error uploading delivery photo:', photoUploadError)
        // Don't throw - status update should continue
      }
    }

    // Update parcel status
    const updateData: any = {
      status: data.new_status,
    }

    if (data.new_status === 'entregado' && photoUrl) {
      updateData.delivery_photo_url = photoUrl
    } else if (data.new_status === 'devuelto') {
      if (data.return_reason) {
        updateData.return_reason = data.return_reason
      }
      if (photoUrl) {
        updateData.return_photo_url = photoUrl
      }
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
      const photoType = data.new_status === 'entregado' ? 'entrega_propietario' : 'devolucion'
      
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
