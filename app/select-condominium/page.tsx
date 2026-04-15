'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserAllCondominiums } from '@/lib/supabase/owner-utils'
import SelectCondominiumClient from './select-condominium-client'

export default async function SelectCondominiumPage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/auth/login')
  }
  
  // Get all condominiums for this user
  const condominiums = await getUserAllCondominiums(supabase, user.email || '')
  
  // If only one condominium, redirect directly to dashboard
  if (condominiums.length === 1) {
    const singleCondo = condominiums[0]
    // Update user profile with this condo
    await supabase
      .from('profiles')
      .update({
        condo_id: singleCondo.id,
        house_id: singleCondo.properties[0]?.id || null
      })
      .eq('id', user.id)
    
    redirect('/dashboard')
  }
  
  // If no condominiums found, something is wrong
  if (condominiums.length === 0) {
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
  
  return <SelectCondominiumClient condominiums={condominiums} />
}
