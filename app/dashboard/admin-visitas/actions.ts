'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAdminVisits() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('condo_id, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') throw new Error('Acceso denegado')

  const { data: visits } = await supabase
    .from('visits')
    .select('*, house:houses(house_number), created_by_profile:profiles!created_by(name)')
    .eq('condo_id', profile?.condo_id)
    .order('visit_date', { ascending: false })

  return visits || []
}

export async function getAdminSupplyRequests() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('condo_id, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') throw new Error('Acceso denegado')

  const { data: requests } = await supabase
    .from('supply_requests')
    .select('*, created_by_profile:profiles!created_by(name), linked_expense:condo_expenses(id, title, amount)')
    .eq('condo_id', profile?.condo_id)
    .order('created_at', { ascending: false })

  return requests || []
}

export async function approveSupplyRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('condo_id, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') throw new Error('Acceso denegado')

  const { error } = await supabase
    .from('supply_requests')
    .update({
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/solicitudes-materiales')
}

export async function rejectSupplyRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('supply_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/solicitudes-materiales')
}

export async function linkExpenseToRequest(requestId: string, expenseId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('supply_requests')
    .update({
      status: 'purchased',
      linked_expense_id: expenseId,
    })
    .eq('id', requestId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/solicitudes-materiales')
}
