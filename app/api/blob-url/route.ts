import { getDownloadUrl } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { pathname } = await request.json()

    if (!pathname) {
      return NextResponse.json({ error: 'pathname required' }, { status: 400 })
    }

    console.log('[v0] Generating download URL for pathname:', pathname)

    try {
      // getDownloadUrl() accepts just the pathname/key for private blobs
      const url = await getDownloadUrl(pathname)
      
      console.log('[v0] Generated download blob URL:', url)
      
      return NextResponse.json({ url })
    } catch (downloadError) {
      console.error('[v0] Error generating download URL:', downloadError)
      throw downloadError
    }
  } catch (error) {
    console.error('[v0] Error generating blob URL:', error)
    return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 })
  }
}
