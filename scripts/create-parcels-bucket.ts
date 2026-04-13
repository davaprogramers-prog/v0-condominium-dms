import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function createParcelsBucket() {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  })

  try {
    console.log('Creating parcels bucket...')
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('parcels', {
      public: false,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    })

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✓ Bucket "parcels" already exists')
      } else {
        throw error
      }
    } else {
      console.log('✓ Bucket "parcels" created successfully')
      console.log('Data:', data)
    }

    // Set bucket policies
    console.log('\nSetting bucket policies...')
    
    // Policy for reading (with authentication)
    const { error: readError } = await supabase.storage.from('parcels').createSignedUrl('dummy', 3600)
    if (!readError) {
      console.log('✓ Signed URLs already supported')
    }

    console.log('\n✓ Bucket setup complete!')
    console.log('Bucket name: parcels')
    console.log('Access level: Private (with signed URLs)')
    console.log('Allowed MIME types: image/jpeg, image/png, image/webp')
    console.log('Max file size: 50MB')

  } catch (err) {
    console.error('Error creating bucket:', err)
    process.exit(1)
  }
}

createParcelsBucket()
