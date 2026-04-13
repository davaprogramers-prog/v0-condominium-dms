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
      // getDownloadUrl() requires a full URL, even for private blobs
      // For the "parcels" bucket, construct the full URL
      // The bucket name is in the environment or we need to extract it from the URL stored in DB
      // Since we're storing pathnames, we need to construct the URL to the parcels bucket
      const parcelsBucketUrl = `https://${process.env.BLOB_STORE_ID}.blob.vercel-storage.com/parcels/${pathname}`
      
      console.log('[v0] Full parcels bucket URL:', parcelsBucketUrl)
      
      const url = await getDownloadUrl(parcelsBucketUrl)
      
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
