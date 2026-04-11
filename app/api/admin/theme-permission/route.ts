import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify user is super_admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }
    
    const { adminId, canChangeTheme } = await request.json()
    
    if (!adminId) {
      return NextResponse.json({ success: false, error: 'Missing adminId' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ can_change_theme: canChangeTheme })
      .eq('id', adminId)
    
    if (error) {
      console.error('[v0] Error updating theme permission:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    
    revalidatePath('/dashboard/administradores')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
