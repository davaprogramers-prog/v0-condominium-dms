import { getDownloadUrl } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { pathname } = await request.json()

    if (!pathname) {
      return NextResponse.json({ error: 'pathname required' }, { status: 400 })
    }

    // Get signed download URL for the blob
    try {
      const url = await getDownloadUrl(pathname)
      return NextResponse.json({ url })
    } catch (error) {
      console.error('[v0] Error getting blob download URL:', error)
      throw error
    }
  } catch (error) {
    console.error('[v0] Error generating blob URL:', error)
    return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 })
  }
}
