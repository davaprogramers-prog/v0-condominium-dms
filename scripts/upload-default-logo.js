import { put } from '@vercel/blob'
import { createClient } from '@supabase/supabase-js'

async function uploadDefaultLogo() {
  // Usar las variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Verificar si ya existe el logo por defecto
  const { data: existingLogo } = await supabase
    .from('logos')
    .select('*')
    .eq('scope', 'global')
    .eq('logo_type', 'app')
    .eq('is_default', true)
    .single()

  if (existingLogo) {
    console.log('Logo por defecto ya existe:', existingLogo.blob_url)
    return
  }

  console.log('Subiendo logo por defecto a Blob...')

  // Nota: Este script debe ejecutarse después de que se haya subido el archivo logo.png a /public
  // El logo ya está en /public/logo.png, solo necesitamos guardarlo en la BD

  // Crear entrada en BD que apunta a /logo.png
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'super_admin')
    .limit(1)
    .single()

  if (!profile) {
    console.error('No super admin found')
    process.exit(1)
  }

  const { error } = await supabase
    .from('logos')
    .insert({
      name: 'InteliCon',
      description: 'Logo principal de InteliCon',
      blob_url: '/logo.png',
      logo_type: 'app',
      scope: 'global',
      condo_id: null,
      created_by: profile.id,
      is_default: true,
    })

  if (error) {
    console.error('Error inserting logo:', error)
    process.exit(1)
  }

  console.log('✓ Logo por defecto guardado')
}

uploadDefaultLogo()
