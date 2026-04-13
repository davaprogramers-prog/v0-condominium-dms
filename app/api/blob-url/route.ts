import { download } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { pathname } = await request.json()

    if (!pathname) {
      return NextResponse.json({ error: 'pathname required' }, { status: 400 })
    }

    console.log('[v0] Generating download URL for pathname:', pathname)

    try {
      // Use download() to get a temporary signed URL for the blob file
      const blob = await download(pathname)
      
      if (!blob) {
        return NextResponse.json({ error: 'blob not found' }, { status: 404 })
      }

      // The blob object contains a url that can be used to access the file
      console.log('[v0] Generated download blob URL:', blob.url)
      
      return NextResponse.json({ url: blob.url })
    } catch (downloadError) {
      console.error('[v0] Error downloading blob:', downloadError)
      throw downloadError
    }
  } catch (error) {
    console.error('[v0] Error generating blob URL:', error)
    return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 })
  }
}
