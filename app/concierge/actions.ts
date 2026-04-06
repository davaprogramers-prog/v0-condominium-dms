'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getCondoVisitsForConcierge() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('condo_id, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'conserje') throw new Error('Acceso denegado')

  const { data: visits } = await supabase
    .from('visits')
    .select('*, house:houses(id, house_number), created_by_profile:profiles!created_by(name)')
    .eq('condo_id', profile?.condo_id)
    .eq('status', 'scheduled')
    .order('visit_date', { ascending: true })

  return visits || []
}

export async function getHousesWithPendingVisits() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('condo_id')
    .eq('id', user.id)
    .single()

  const { data: houses } = await supabase
    .from('houses')
    .select('id, house_number, profiles(name, email)')
    .eq('condo_id', profile?.condo_id)
    .order('house_number', { ascending: true })

  const { data: visitCounts } = await supabase
    .from('visits')
    .select('house_id')
    .eq('condo_id', profile?.condo_id)
    .eq('status', 'scheduled')

  const visitCountMap = (visitCounts || []).reduce((acc: Record<string, number>, visit: any) => {
    acc[visit.house_id] = (acc[visit.house_id] || 0) + 1
    return acc
  }, {})

  return (houses || []).map((house: any) => ({
    ...house,
    pending_visits: visitCountMap[house.id] || 0,
  }))
}

export async function createSupplyRequest(data: {
  requestTitle: string
  requestDescription: string
  requestCategory: 'cleaning' | 'materials' | 'supplies' | 'maintenance' | 'other'
  quantity?: number
  unitPrice?: number
  estimatedCost?: number
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('condo_id, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'conserje') throw new Error('Solo conserjes pueden crear solicitudes')

  const { error } = await supabase
    .from('supply_requests')
    .insert({
      condo_id: profile.condo_id,
      created_by: user.id,
      request_title: data.requestTitle,
      request_description: data.requestDescription,
      request_category: data.requestCategory,
      quantity: data.quantity,
      unit_price: data.unitPrice,
      estimated_cost: data.estimatedCost,
      priority: data.priority || 'normal',
    })

  if (error) throw new Error(error.message)
  revalidatePath('/concierge/dashboard')
}

export async function getSupplyRequests() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('condo_id, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'conserje') throw new Error('Acceso denegado')

  const { data: requests } = await supabase
    .from('supply_requests')
    .select('*')
    .eq('condo_id', profile?.condo_id)
    .order('created_at', { ascending: false })

  return requests || []
}

export async function createWorklog(data: {
  activityType: string
  activityDescription: string
  activityDate: string
  activityTime?: string
  houseId?: string
  notes?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('condo_id')
    .eq('id', user.id)
    .single()

  const { error } = await supabase
    .from('concierge_worklogs')
    .insert({
      condo_id: profile?.condo_id,
      concierge_id: user.id,
      activity_type: data.activityType,
      activity_description: data.activityDescription,
      activity_date: data.activityDate,
      activity_time: data.activityTime,
      house_id: data.houseId,
      notes: data.notes,
    })

  if (error) throw new Error(error.message)
  revalidatePath('/concierge/dashboard')
}
