import { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, Plus, Calendar, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VisitsList } from './visits-list'
import { CreateVisitDialog } from './create-visit-dialog'
import { getUserCondoId, getUserHouseId } from '@/lib/supabase/owner-utils'
import { type CondoTheme, DEFAULT_THEME } from '@/lib/theme-utils'

export const metadata: Metadata = {
  title: 'Mis Visitas | Condominio',
  description: 'Registra y gestiona las visitas a tu propiedad',
}

export default async function VisitasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get condo_id and house_id using utility functions
  const condoId = await getUserCondoId(supabase, user.id)
  const houseId = await getUserHouseId(supabase, user.id)

  if (!condoId) {
    redirect("/dashboard")
  }

  // Get all houses in the condo
  const { data: houses } = await supabase
    .from("houses")
    .select("id, house_number")
    .eq("condo_id", condoId)
    .order("house_number", { ascending: true })

  // Get visits for the user's houses
  let visits = []
  if (houseId) {
    const { data: userVisits } = await supabase
      .from("visits")
      .select("*, house:houses(house_number)")
      .eq("house_id", houseId)
      .eq("condo_id", condoId)
      .order("visit_date", { ascending: false })
    
    if (userVisits) {
      visits = userVisits
    }
  }

  // Get condo theme
  const { data: themeData } = await supabase
    .from("condominiums")
    .select("enable_custom_theme, card_bg_color, card_text_color, border_color")
    .eq("id", condoId)
    .single()

  const theme = themeData as CondoTheme | null
  const cardBgColor = theme?.enable_custom_theme ? theme.card_bg_color : DEFAULT_THEME.card_bg_color
  const cardTextColor = theme?.enable_custom_theme ? theme.card_text_color : DEFAULT_THEME.card_text_color
  const borderColor = theme?.enable_custom_theme ? theme.border_color : DEFAULT_THEME.border_color

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-500" />
            Mis Visitas
          </h1>
          <p className="text-muted-foreground mt-1">Registra y gestiona las visitas a tu propiedad</p>
        </div>
        <CreateVisitDialog houses={houses || []} houseId={houseId} />
      </div>

      {/* Content */}
      <VisitsList visits={visits} cardBgColor={cardBgColor} cardTextColor={cardTextColor} borderColor={borderColor} />
    </div>
  )
}
