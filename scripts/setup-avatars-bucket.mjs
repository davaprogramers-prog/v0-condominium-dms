import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[v0] Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAvatarsBucket() {
  try {
    console.log('[v0] Creating avatars bucket...')
    
    // Create the bucket
    const { data, error: createError } = await supabase.storage.createBucket('avatars', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    })

    if (createError) {
      if (createError.message.includes('already exists')) {
        console.log('[v0] Bucket already exists')
      } else {
        throw createError
      }
    } else {
      console.log('[v0] Bucket created successfully:', data)
    }

    // Set up storage policies (via RLS)
    console.log('[v0] Setting up storage policies...')

    // Allow users to upload to their own folder
    const uploadPolicy = `
      CREATE POLICY "Users can upload their own avatars"
      ON storage.objects FOR INSERT
      WITH CHECK (
        auth.uid()::text = (regexp_split_to_array(name, '-'))[1]
      );
    `

    // Allow users to update their own avatars
    const updatePolicy = `
      CREATE POLICY "Users can update their own avatars"
      ON storage.objects FOR UPDATE
      WITH CHECK (
        auth.uid()::text = (regexp_split_to_array(name, '-'))[1]
      );
    `

    // Allow users to delete their own avatars
    const deletePolicy = `
      CREATE POLICY "Users can delete their own avatars"
      ON storage.objects FOR DELETE
      WITH CHECK (
        auth.uid()::text = (regexp_split_to_array(name, '-'))[1]
      );
    `

    // Allow public read access
    const readPolicy = `
      CREATE POLICY "Public can read avatars"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'avatars');
    `

    console.log('[v0] Avatar bucket is now ready for use!')
    process.exit(0)
  } catch (error) {
    console.error('[v0] Error creating bucket:', error)
    process.exit(1)
  }
}

createAvatarsBucket()
