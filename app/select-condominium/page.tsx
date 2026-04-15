'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserAllCondominiums } from '@/lib/supabase/owner-utils'
import SelectCondominiumClient from './select-condominium-client'

export default async function SelectCondominiumPage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  console.log("[v0] SelectCondominiumPage - user:", user?.email, "error:", userError)
  
  if (userError || !user) {
    console.log("[v0] No user found, redirecting to login")
    redirect('/auth/login')
  }
  
  // Get all condominiums for this user
  const condominiums = await getUserAllCondominiums(supabase, user.email || '')
  
  console.log("[v0] Found condominiums:", condominiums.length, condominiums)
  
  // If only one condominium, redirect directly to dashboard
  if (condominiums.length === 1) {
    const singleCondo = condominiums[0]
    console.log("[v0] Only one condominium found, auto-selecting:", singleCondo.id)
    
    // Update user profile with this condo
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        condo_id: singleCondo.id,
        house_id: singleCondo.properties[0]?.id || null
      })
      .eq('id', user.id)
    
    console.log("[v0] Profile update result:", { error: updateError })
    redirect('/dashboard')
  }
  
  // If no condominiums found, something is wrong
  if (condominiums.length === 0) {
    console.log("[v0] No condominiums found for user")
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">No se encontraron propiedades</h1>
          <p className="text-slate-400 mb-6">No tienes propiedades registradas en el sistema</p>
          <a href="/auth/logout" className="text-blue-500 hover:underline">
            Cerrar sesión
          </a>
        </div>
      </div>
    )
  }
  
  // Get themes for all condominiums
  const { data: themes } = await supabase
    .from('condominium_themes')
    .select('*')
    .in('condo_id', condominiums.map(c => c.id))
  
  const themeMap = new Map(themes?.map(t => [t.condo_id, t]) || [])
  
  console.log("[v0] Showing selector for", condominiums.length, "condominiums")
  return <SelectCondominiumClient condominiums={condominiums} themes={themeMap} />
}
