'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createVisit(data: {
  houseId: string
  visitorName: string
  visitTitle: string
  visitDate: string
  visitTime?: string
  visitorEmail?: string
  visitorPhone?: string
  description?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('condo_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.condo_id) throw new Error('No tienes condominio')

  const { error } = await supabase
    .from('visits')
    .insert({
      condo_id: profile.condo_id,
      house_id: data.houseId,
      created_by: user.id,
      visitor_name: data.visitorName,
      visit_title: data.visitTitle,
      visit_date: data.visitDate,
      visit_time: data.visitTime,
      visitor_email: data.visitorEmail,
      visitor_phone: data.visitorPhone,
      description: data.description,
    })

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/visitas')
}

export async function getOwnerVisits() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('condo_id')
    .eq('id', user.id)
    .single()

  const { data: visits } = await supabase
    .from('visits')
    .select('*, house:houses(id, house_number, profiles:profiles(name, email))')
    .eq('condo_id', profile?.condo_id)
    .eq('created_by', user.id)
    .order('visit_date', { ascending: false })

  return visits || []
}

export async function getCondoVisits() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('condo_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.condo_id) throw new Error('No tienes condominio')

  const { data: visits } = await supabase
    .from('visits')
    .select('*, house:houses(id, house_number), created_by_profile:profiles!created_by(name)')
    .eq('condo_id', profile.condo_id)
    .order('visit_date', { ascending: false })

  return visits || []
}

export async function updateVisitStatus(visitId: string, status: 'scheduled' | 'completed' | 'cancelled') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('visits')
    .update({ status })
    .eq('id', visitId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/visitas')
}

export async function getCondoVisitsForConcierge() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('condo_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.condo_id || profile.role !== 'conserje') {
    throw new Error('No tienes permiso para ver estas visitas')
  }

  const { data: visits } = await supabase
    .from('visits')
    .select('*, house:houses(id, house_number), created_by_profile:profiles!created_by(name, email)')
    .eq('condo_id', profile.condo_id)
    .order('visit_date', { ascending: false })

  return visits || []
}

export async function deleteVisit(visitId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('visits')
    .delete()
    .eq('id', visitId)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard/visitas')
}
