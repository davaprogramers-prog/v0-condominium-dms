import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { VisitsList } from './visits-list'
import { CreateVisitDialog } from './create-visit-dialog'

export const metadata: Metadata = {
  title: 'Mis Visitas | Condominio Canelo',
  description: 'Registra y gestiona las visitas a tu propiedad',
}

export default async function VisitasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>No autenticado</div>
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('condo_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.condo_id) {
    return <div>No tienes condominio asignado</div>
  }

  // Get user's houses
  const { data: houses } = await supabase
    .from('houses')
    .select('id, house_number')
    .eq('condo_id', profile.condo_id)
    .order('house_number', { ascending: true })

  // Get visits
  const { data: visits } = await supabase
    .from('visits')
    .select('*, house:houses(house_number)')
    .eq('created_by', user.id)
    .eq('condo_id', profile.condo_id)
    .order('visit_date', { ascending: false })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 sticky top-0 z-10">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="md:hidden">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-semibold">Mis Visitas</h1>
          </div>
          <CreateVisitDialog houses={houses || []} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-4">
          <VisitsList visits={visits || []} />
        </div>
      </div>
    </div>
  )
}
