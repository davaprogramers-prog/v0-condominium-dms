import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkParcelPhotos() {
  try {
    // Get all parcel photos from the database
    const { data: photos, error } = await supabase
      .from('parcel_photos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching photos:', error)
      return
    }

    console.log(`\n📸 Found ${photos.length} photos in database:\n`)
    
    photos.forEach((photo, index) => {
      console.log(`${index + 1}. Photo ID: ${photo.id}`)
      console.log(`   Type: ${photo.photo_type}`)
      console.log(`   URL: ${photo.photo_url}`)
      console.log(`   Created: ${photo.created_at}`)
      console.log(`   Parcel ID: ${photo.parcel_id}`)
      console.log('')
    })

    // Also check parcels with photos
    console.log('\n📦 Parcels with photos:\n')
    const { data: parcelsWithPhotos, error: parcelError } = await supabase
      .from('parcels')
      .select(`
        id,
        from_sender,
        status,
        received_date,
        parcel_photos (
          id,
          photo_type,
          photo_url
        )
      `)
      .not('parcel_photos', 'is', null)
      .limit(5)

    if (parcelError) {
      console.error('Error fetching parcels:', parcelError)
      return
    }

    parcelsWithPhotos.forEach((parcel) => {
      console.log(`Parcel: ${parcel.id}`)
      console.log(`  From: ${parcel.from_sender}`)
      console.log(`  Status: ${parcel.status}`)
      console.log(`  Photos: ${parcel.parcel_photos.length}`)
      parcel.parcel_photos.forEach((p) => {
        console.log(`    - ${p.photo_type}: ${p.photo_url.substring(0, 80)}...`)
      })
      console.log('')
    })
  } catch (err) {
    console.error('Error:', err)
  }
}

checkParcelPhotos()
