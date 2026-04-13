import { download } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { pathname } = await request.json()

    if (!pathname) {
      return NextResponse.json({ error: 'pathname required' }, { status: 400 })
    }

    // Get signed download URL for the blob
    // Vercel Blob automatically generates signed URLs for private blobs
    try {
      const blob = await download(pathname)
      
      if (!blob) {
        return NextResponse.json({ error: 'blob not found' }, { status: 404 })
      }

      // Return the blob URL which is already signed
      const url = blob.url
      return NextResponse.json({ url })
    } catch (error) {
      console.error('[v0] Error downloading blob:', error)
      throw error
    }
  } catch (error) {
    console.error('[v0] Error generating blob URL:', error)
    return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 })
  }
}
