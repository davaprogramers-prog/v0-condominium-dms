import { get } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { pathname } = await request.json()

    if (!pathname) {
      return NextResponse.json({ error: 'pathname required' }, { status: 400 })
    }

    // Get signed URL for the blob
    const blob = await get(pathname)
    
    if (!blob) {
      return NextResponse.json({ error: 'blob not found' }, { status: 404 })
    }

    return NextResponse.json({ url: blob.downloadUrl })
  } catch (error) {
    console.error('[v0] Error generating blob URL:', error)
    return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 })
  }
}
