'use server'

import { createClient } from '@/lib/supabase/server'
import { put } from '@vercel/blob'
import { revalidatePath } from 'next/cache'

export async function uploadLogo(
  formData: FormData,
  logoType: 'app' | 'expense_category' | 'custom',
  scope: 'global' | 'condo',
  condoId?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado')

  // Verificar permisos
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, condo_id')
    .eq('id', user.id)
    .single()

  if (scope === 'global' && profile.role !== 'super_admin') {
    throw new Error('Solo super admin puede crear logos globales')
  }

  if (scope === 'condo' && !condoId) {
    throw new Error('condoId requerido para logos de condominio')
  }

  // Obtener archivo
  const file = formData.get('file') as File
  if (!file) throw new Error('Archivo requerido')

  // Validar tipo
  if (!file.type.startsWith('image/')) {
    throw new Error('Debe ser una imagen')
  }

  // Validar tamaño (máx 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Máximo 5MB')
  }

  // Subir a Blob
  const filename = `logos/${scope}/${logoType}/${Date.now()}-${file.name}`
  const blob = await put(filename, file, {
    access: 'public',
  })

  // Guardar referencia en BD
  const { error } = await supabase
    .from('logos')
    .insert({
      name: formData.get('name'),
      description: formData.get('description'),
      blob_url: blob.url,
      logo_type: logoType,
      scope,
      condo_id: scope === 'condo' ? condoId : null,
      created_by: user.id,
      is_default: formData.get('is_default') === 'true',
    })

  if (error) throw new Error(error.message)

  revalidatePath('/')
  return blob.url
}

export async function getLogos(logoType: 'app' | 'expense_category' | 'custom', condoId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('logos')
    .select('*')
    .eq('logo_type', logoType)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (condoId) {
    query = query.or(`scope.eq.global,and(scope.eq.condo,condo_id.eq.${condoId})`)
  } else {
    query = query.eq('scope', 'global')
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)
  return data
}

export async function setDefaultLogo(logoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado')

  // Obtener el logo
  const { data: logo } = await supabase
    .from('logos')
    .select('*')
    .eq('id', logoId)
    .single()

  // Verificar permisos
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, condo_id')
    .eq('id', user.id)
    .single()

  if (logo.scope === 'global' && profile.role !== 'super_admin') {
    throw new Error('Solo super admin puede actualizar logos globales')
  }

  if (logo.scope === 'condo' && logo.condo_id !== profile.condo_id) {
    throw new Error('No puedes actualizar logos de otro condominio')
  }

  // Desactivar otros logos del mismo tipo y scope
  await supabase
    .from('logos')
    .update({ is_default: false })
    .match({
      logo_type: logo.logo_type,
      scope: logo.scope,
      condo_id: logo.condo_id,
    })

  // Activar este logo
  await supabase
    .from('logos')
    .update({ is_default: true })
    .eq('id', logoId)

  revalidatePath('/')
}

export async function deleteLogo(logoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('No autenticado')

  const { data: logo } = await supabase
    .from('logos')
    .select('*')
    .eq('id', logoId)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, condo_id')
    .eq('id', user.id)
    .single()

  if (logo.scope === 'global' && profile.role !== 'super_admin') {
    throw new Error('Solo super admin puede eliminar logos globales')
  }

  if (logo.scope === 'condo' && logo.condo_id !== profile.condo_id) {
    throw new Error('No puedes eliminar logos de otro condominio')
  }

  await supabase
    .from('logos')
    .delete()
    .eq('id', logoId)

  revalidatePath('/')
}
