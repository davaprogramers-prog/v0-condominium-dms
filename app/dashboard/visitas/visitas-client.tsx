'use client'

import { useState, useMemo } from 'react'
import { Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { VisitsList } from './visits-list'
import { CreateVisitDialog } from './create-visit-dialog'

interface Visit {
  id: string
  visitor_name: string
  visit_title: string
  visit_date: string
  visit_time?: string
  visitor_email?: string
  visitor_phone?: string
  description?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  house?: {
    house_number: string
  }
}

interface VisitasPageClientProps {
  initialVisits: Visit[]
  isViewingAsAdmin: boolean
  isAdmin: boolean
  isConcierge: boolean
  houseId?: string
  houses: Array<{ id: string; house_number: string }>
  condoId: string
}

export default function VisitasPageClient({
  initialVisits,
  isViewingAsAdmin,
  isAdmin,
  isConcierge,
  houseId,
  houses,
  condoId,
}: VisitasPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all')

  // Filter visits based on search and status
  const filteredVisits = useMemo(() => {
    let filtered = initialVisits || []

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(v => v.status === filterStatus)
    }

    // Filter by search query (search in visitor name, title, email, phone)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(v =>
        v.visitor_name.toLowerCase().includes(query) ||
        v.visit_title.toLowerCase().includes(query) ||
        v.visitor_email?.toLowerCase().includes(query) ||
        v.visitor_phone?.includes(query)
      )
    }

    return filtered
  }, [initialVisits, searchQuery, filterStatus])

  const scheduledCount = initialVisits.filter(v => v.status === 'scheduled').length
  const completedCount = initialVisits.filter(v => v.status === 'completed').length
  const cancelledCount = initialVisits.filter(v => v.status === 'cancelled').length
  const totalCount = initialVisits.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-500" />
            {isViewingAsAdmin ? 'Visitas del Condominio' : 'Mis Visitas'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isViewingAsAdmin ? 'Gestiona todas las visitas del condominio' : 'Registra y gestiona las visitas a tu propiedad'}
          </p>
        </div>
        {houseId && <CreateVisitDialog houses={houses || []} houseId={houseId} />}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Programadas</p>
              <p className="text-2xl font-bold">{scheduledCount}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500 opacity-20" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completadas</p>
              <p className="text-2xl font-bold">{completedCount}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500 opacity-20" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Canceladas</p>
              <p className="text-2xl font-bold">{cancelledCount}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500 opacity-20" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
            <Calendar className="h-8 w-8 text-primary opacity-20" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <Input
          placeholder="Buscar por visitante, correo o teléfono..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
          >
            Todas ({totalCount})
          </Button>
          <Button
            variant={filterStatus === 'scheduled' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('scheduled')}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Programadas ({scheduledCount})
          </Button>
          <Button
            variant={filterStatus === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('completed')}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Completadas ({completedCount})
          </Button>
          <Button
            variant={filterStatus === 'cancelled' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('cancelled')}
            className="flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            Canceladas ({cancelledCount})
          </Button>
        </div>
      </div>

      {/* Content */}
      <VisitsList visits={filteredVisits} />
    </div>
  )
}
