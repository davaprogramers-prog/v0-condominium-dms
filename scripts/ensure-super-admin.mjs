import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function ensureSuperAdminUser() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const superAdminEmail = 'davaprogramers@gmail.com'
  
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('email', superAdminEmail)
    .single()

  if (existingProfile && existingProfile.role === 'super_admin') {
    console.log('Super admin user already exists with correct role')
    return
  }

  // If profile exists but role is not super_admin, update it
  if (existingProfile) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'super_admin' })
      .eq('id', existingProfile.id)

    if (updateError) {
      console.error('Error updating super admin role:', updateError)
    } else {
      console.log('Updated user to super_admin role')
    }
    return
  }

  // If profile doesn't exist, we need to create it through auth
  console.log('Super admin profile does not exist. Please sign up first with davaprogramers@gmail.com')
}

ensureSuperAdminUser().catch(console.error)
