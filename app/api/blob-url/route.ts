import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { pathname } = await request.json()

    if (!pathname) {
      return NextResponse.json({ error: 'pathname required' }, { status: 400 })
    }

    console.log('[v0] Generating signed URL for pathname:', pathname)

    // Vercel Blob pathnames stored are in format: parcels/condo-id/parcel-id/filename.jpg
    // Build the full blob URL
    const blobUrl = `https://blob.vercel-storage.com/${pathname}`
    console.log('[v0] Generated blob URL:', blobUrl)

    return NextResponse.json({ url: blobUrl })
  } catch (error) {
    console.error('[v0] Error generating blob URL:', error)
    return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 })
  }
}
