'use server'

import { esSuperAdminEfectivo } from "@/lib/auth/plataforma/guardia"
import { autorizarAdminDeCondominio } from "@/lib/auth/condominio"
import { createClient } from '@/lib/supabase/server'
import { put } from '@vercel/blob'
import { revalidatePath } from 'next/cache'

/** Logos de condominio: solo su administrador (o super admin efectivo). Globales: solo super admin efectivo. */
async function exigirGestionDeLogo(
  logo: { scope?: string | null; condo_id?: string | null } | null,
  accion: 'actualizar' | 'eliminar',
) {
  if (!logo) throw new Error('Logo no encontrado')
  if (logo.scope === 'condo') {
    const acceso = await autorizarAdminDeCondominio(logo.condo_id)
    if (!acceso.ok) throw new Error(acceso.error)
    return
  }
  if (!(await esSuperAdminEfectivo())) {
    throw new Error(`Solo super admin puede ${accion} logos globales`)
  }
}

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

  if (!profile) {
    throw new Error('Perfil no encontrado')
  }

  if (scope === 'global' && !(profile.role === "super_admin" && (await esSuperAdminEfectivo()))) {
    throw new Error('Solo super admin puede crear logos globales')
  }

  if (scope !== 'global' && scope !== 'condo') throw new Error('Alcance no válido')

  if (scope === 'condo') {
    const acceso = await autorizarAdminDeCondominio(condoId)
    if (!acceso.ok) throw new Error(acceso.error)
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
    .maybeSingle()

  await exigirGestionDeLogo(logo, 'actualizar')

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
    .maybeSingle()

  await exigirGestionDeLogo(logo, 'eliminar')

  await supabase
    .from('logos')
    .delete()
    .eq('id', logoId)

  revalidatePath('/')
}
