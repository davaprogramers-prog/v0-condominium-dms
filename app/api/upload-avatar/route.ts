import { put } from '@vercel/blob'
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

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Upload new avatar to Vercel Blob with private access
    // Since Blob store is configured as private, we use private access
    // and generate a signed URL for temporary access
    const blob = await put(`avatars/${user.id}-${Date.now()}`, file, {
      access: 'private',
    })

    // Generate a signed URL for 24 hours
    const signedUrl = await blob.getSignedUrl()

    console.log('[v0] Avatar uploaded to private Blob store')
    console.log('[v0] Base URL:', blob.url)
    console.log('[v0] Signed URL:', signedUrl)

    // Return the signed URL which will be valid for 24 hours
    return NextResponse.json({ url: signedUrl })
  } catch (error) {
    console.error('[v0] Avatar upload API error:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
