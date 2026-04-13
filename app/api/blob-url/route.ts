import { getDownloadUrl } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { pathname } = await request.json()

    if (!pathname) {
      return NextResponse.json({ error: 'pathname required' }, { status: 400 })
    }

    // Get the blob store host from environment
    // The BLOB_READ_WRITE_TOKEN contains the host info
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'Blob storage not configured' }, { status: 500 })
    }

    // Extract host from token (format: {randomId}:{base64encodedhost})
    // For simplicity, construct the blob URL using the standard Vercel Blob domain
    const blobUrl = `https://blob.vercel-storage.com${pathname}`

    try {
      const url = await getDownloadUrl(blobUrl)
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
