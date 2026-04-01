import { uploadLogo } from '@/app/actions/logos'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const logoType = formData.get('logoType') as 'app' | 'expense_category' | 'custom'
    const scope = formData.get('scope') as 'global' | 'condo'
    const condoId = formData.get('condoId') as string | undefined

    const blobUrl = await uploadLogo(formData, logoType, scope, condoId)
    return NextResponse.json({ blob_url: blobUrl })
  } catch (error) {
    console.error('Error uploading logo:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error uploading logo' },
      { status: 400 }
    )
  }
}
