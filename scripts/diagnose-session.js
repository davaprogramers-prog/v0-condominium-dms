import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('[v0] Missing Supabase environment variables')
  process.exit(1)
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('[v0] ===== Diagnostic: Session & User Check =====')
  
  // Get davaprogramers@gmail.com user
  const { data: users, error: usersError } = await adminClient.auth.admin.listUsers()
  
  if (usersError) {
    console.error('[v0] Error listing users:', usersError)
    return
  }

  const davaUser = users.users.find(u => u.email === 'davaprogramers@gmail.com')
  
  if (!davaUser) {
    console.error('[v0] davaprogramers@gmail.com not found in auth.users')
    return
  }

  console.log('[v0] User found:')
  console.log('  - ID:', davaUser.id)
  console.log('  - Email:', davaUser.email)
  console.log('  - Email confirmed:', !!davaUser.email_confirmed_at)
  console.log('  - Last sign in:', davaUser.last_sign_in_at)
  console.log('  - Metadata:', davaUser.user_metadata)

  // Check profile
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', davaUser.id)
    .single()

  if (profileError) {
    console.error('[v0] Error fetching profile:', profileError)
    return
  }

  console.log('[v0] Profile found:')
  console.log('  - Role:', profile.role)
  console.log('  - Condo ID:', profile.condo_id)
  console.log('  - First name:', profile.first_name)
  console.log('  - Last name:', profile.last_name)

  // Verify condo exists
  const { data: condo, error: condoError } = await adminClient
    .from('condominiums')
    .select('id, name')
    .eq('id', profile.condo_id)
    .single()

  if (condoError) {
    console.error('[v0] Error fetching condo:', condoError)
    return
  }

  console.log('[v0] Condominium found:')
  console.log('  - Name:', condo.name)
  console.log('  - ID:', condo.id)

  console.log('[v0] ===== ALL CHECKS PASSED - DATA IS CORRECT =====')
  console.log('[v0] The issue is likely with SESSION/COOKIES, not the data')
  console.log('[v0] Check:')
  console.log('  1. Middleware is being called')
  console.log('  2. Cookies are being set/read correctly')
  console.log('  3. supabase.auth.getUser() is working across requests')
}

main().catch(console.error)
