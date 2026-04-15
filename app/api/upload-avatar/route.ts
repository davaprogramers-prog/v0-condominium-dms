import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Delete old avatar if it exists
    if (oldUrl && oldUrl.includes('/storage/v1/object/public/avatars/')) {
      try {
        const oldPath = oldUrl.split('/storage/v1/object/public/avatars/')[1]
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([oldPath])
        }
      } catch (e) {
        console.log('[v0] Could not delete old avatar:', e)
      }
    }

    // Upload new avatar to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`

    const { data, error: uploadError } = await supabase.storage
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
    const { data: urlData } = supabase.storage
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
