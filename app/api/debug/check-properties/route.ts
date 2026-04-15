import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Get all houses for this email
    const { data: houses, error } = await supabase
      .from('houses')
      .select('id, house_number, condo_id, condominiums(id, name)')
      .eq('owner_email', email)

    console.log('[v0] DEBUG ENDPOINT - Email:', email, 'Houses found:', houses?.length, 'Error:', error)

    return Response.json({
      email,
      housesCount: houses?.length || 0,
      houses: houses || [],
      error
    })
  } catch (err) {
    console.error('[v0] DEBUG ENDPOINT ERROR:', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
