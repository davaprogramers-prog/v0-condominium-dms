import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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

  // Get condo_id from houses (for owners) or user_condos (for admins)
  let condo_id: string | null = null

  // Try to get from houses first (for owners)
  try {
    const { data: house, error: hError } = await supabase
      .from("houses")
      .select("condo_id")
      .eq("owner_id", user.id)
      .limit(1)
      .single()

    if (house?.condo_id && !hError) {
      condo_id = house.condo_id
    }
  } catch (e) {
    console.log("[v0] No owner house found in visitas")
  }

  // If not found, try to get from user_condos (for admin/super_admin)
  if (!condo_id) {
    try {
      const { data: userCondos, error: ucError } = await supabase
        .from("user_condos")
        .select("condo_id")
        .eq("user_id", user.id)
        .limit(1)
        .single()

      if (userCondos?.condo_id && !ucError) {
        condo_id = userCondos.condo_id
      }
    } catch (e) {
      console.log("[v0] No admin condo found in visitas")
    }
  }

  if (!condo_id) {
    return <div>No tienes condominio asignado</div>
  }

  // Get user's houses
  const { data: houses } = await supabase
    .from("houses")
    .select("id, house_number")
    .eq("condo_id", condo_id)
    .order("house_number", { ascending: true })

  // Get visits
  const { data: visits } = await supabase
    .from("visits")
    .select("*, house:houses(house_number)")
    .eq("created_by", user.id)
    .eq("condo_id", condo_id)
    .order("visit_date", { ascending: false })

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
