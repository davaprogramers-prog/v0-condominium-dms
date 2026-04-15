import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

async function ensureAvatarsBucket(supabaseAdmin: any) {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const avatarsBucketExists = buckets?.some((b: any) => b.name === 'avatars')

    if (!avatarsBucketExists) {
      console.log('[v0] Creating avatars bucket...')
      const { data, error } = await supabaseAdmin.storage.createBucket('avatars', {
        public: true,
      })
      if (error) {
        console.error('[v0] Error creating bucket:', error)
        throw error
      }
      console.log('[v0] Avatars bucket created successfully')
    }
  } catch (error) {
    console.error('[v0] Error ensuring avatars bucket:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const oldUrl = formData.get('oldUrl') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Verify file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use admin client for storage operations (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Ensure the avatars bucket exists
    await ensureAvatarsBucket(supabaseAdmin)

    // Delete old avatar if it exists
    if (oldUrl && oldUrl.includes('/storage/v1/object/public/avatars/')) {
      try {
        const oldPath = oldUrl.split('/storage/v1/object/public/avatars/')[1]
        if (oldPath) {
          await supabaseAdmin.storage
            .from('avatars')
            .remove([oldPath])
        }
      } catch (e) {
        console.log('[v0] Could not delete old avatar:', e)
      }
    }

    // Upload new avatar to Supabase Storage using admin client
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`

    const { data, error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('[v0] Supabase upload error:', uploadError)
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(fileName)

    console.log('[v0] Avatar uploaded successfully to Supabase Storage:', urlData.publicUrl)

    return NextResponse.json({
      url: urlData.publicUrl,
    })
  } catch (error) {
    console.error('[v0] Avatar upload error:', error)
    return NextResponse.json(
      { error: `Upload failed: ${String(error)}` },
      { status: 500 }
    )
  }
}
