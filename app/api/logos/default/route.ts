import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('logos')
      .select('*')
      .eq('scope', 'global')
      .eq('logo_type', 'app')
      .eq('is_default', true)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { blob_url: '/intelicon-logo.png' },
        { status: 200 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching default logo:', error)
    return NextResponse.json(
      { blob_url: '/intelicon-logo.png' },
      { status: 200 }
    )
  }
}
