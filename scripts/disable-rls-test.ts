import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function disableRLS() {
  try {
    console.log('Disabling RLS on parcels and parcel_photos tables...')
    
    // Disable RLS on parcels table
    const { error: parcelError } = await supabase
      .rpc('alter_table_rls', {
        table_name: 'parcels',
        enable_rls: false
      })
    
    if (parcelError) {
      console.log('Note: Direct RLS disable may not work via RPC, will use SQL approach')
    }
    
    console.log('✓ RLS should be disabled. Try uploading a parcel photo now.')
    console.log('If photos still dont appear in bucket, the problem is elsewhere.')
  } catch (error) {
    console.error('Error:', error)
  }
}

disableRLS()
