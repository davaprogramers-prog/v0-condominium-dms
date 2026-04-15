import { put, del } from '@vercel/blob'
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

    // Delete old avatar if it exists and is from Blob
    if (oldUrl && oldUrl.includes('blob.vercel-storage.com')) {
      try {
        await del(oldUrl)
      } catch (error) {
        console.error('[v0] Error deleting old avatar:', error)
        // Continue even if delete fails
      }
    }

    // Upload new avatar to Vercel Blob
    const blob = await put(`avatars/${user.id}-${Date.now()}`, file, {
      access: 'private',
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error('[v0] Avatar upload API error:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
