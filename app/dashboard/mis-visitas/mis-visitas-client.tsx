'use client'

import { useState, useMemo } from 'react'
import { Calendar, Clock, CheckCircle2, AlertCircle, X, Plus, User, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useTheme } from '@/app/dashboard/theme-context'
import { CreateVisitDialog } from '../visitas/create-visit-dialog'

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
  house_id: string
}

interface MisVisitasClientProps {
  visits: Visit[]
  houseId: string
  condoId: string
  houseNumber: string
}

export default function MisVisitasClient({
  visits,
  houseId,
  condoId,
  houseNumber,
}: MisVisitasClientProps) {
  const { cardBgColor, cardTextColor } = useTheme()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Filter visits
  const filteredVisits = useMemo(() => {
    let filtered = visits || []

    if (filterStatus !== 'all') {
      filtered = filtered.filter(v => v.status === filterStatus)
    }

    if (dateFrom) {
      const [year, month, day] = dateFrom.split('-').map(Number)
      const fromDate = new Date(year, month - 1, day, 0, 0, 0, 0)
      filtered = filtered.filter(v => new Date(v.visit_date) >= fromDate)
    }
    if (dateTo) {
      const [year, month, day] = dateTo.split('-').map(Number)
      const toDate = new Date(year, month - 1, day, 23, 59, 59, 999)
      filtered = filtered.filter(v => new Date(v.visit_date) <= toDate)
    }

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
  }, [visits, searchQuery, filterStatus, dateFrom, dateTo])

  const scheduledCount = visits.filter(v => v.status === 'scheduled').length
  const completedCount = visits.filter(v => v.status === 'completed').length
  const cancelledCount = visits.filter(v => v.status === 'cancelled').length
  const totalCount = visits.length

  const clearFilters = () => {
    setSearchQuery('')
    setFilterStatus('all')
    setDateFrom('')
    setDateTo('')
  }

  const hasActiveFilters = searchQuery || filterStatus !== 'all' || dateFrom || dateTo

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Programada</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Completada</Badge>
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">Cancelada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-500" />
            Mis Visitas
          </h1>
          <p className="text-muted-foreground mt-1">
            Visitas programadas para Casa #{houseNumber}
          </p>
        </div>
        <CreateVisitDialog 
          houses={[{ id: houseId, house_number: houseNumber }]} 
          houseId={houseId} 
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      <div className="space-y-4 bg-secondary/20 p-4 rounded-lg border">
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Buscar visitante, correo, teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Desde"
              title="Fecha desde"
              className="w-full sm:w-40"
            />
            <span className="hidden sm:block text-muted-foreground text-sm">-</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Hasta"
              title="Fecha hasta"
              className="w-full sm:w-40"
            />
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2 h-10 w-full sm:w-auto"
              >
                <X className="h-4 w-4" />
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Status Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
            size="sm"
          >
            Todas ({totalCount})
          </Button>
          <Button
            variant={filterStatus === 'scheduled' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('scheduled')}
            className="flex items-center gap-2"
            size="sm"
          >
            <Clock className="h-4 w-4" />
            Programadas ({scheduledCount})
          </Button>
          <Button
            variant={filterStatus === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('completed')}
            className="flex items-center gap-2"
            size="sm"
          >
            <CheckCircle2 className="h-4 w-4" />
            Completadas ({completedCount})
          </Button>
          <Button
            variant={filterStatus === 'cancelled' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('cancelled')}
            className="flex items-center gap-2"
            size="sm"
          >
            <AlertCircle className="h-4 w-4" />
            Canceladas ({cancelledCount})
          </Button>
        </div>
      </div>

      {/* Visits List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Visitas Registradas</h2>
        {filteredVisits.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay visitas registradas</p>
            <p className="text-sm text-muted-foreground mt-1">
              Registra una nueva visita usando el botón de arriba
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredVisits.map((visit) => (
              <div
                key={visit.id}
                className="rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                style={{ backgroundColor: cardBgColor, color: cardTextColor }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{visit.visit_title}</h3>
                      {getStatusBadge(visit.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {visit.visitor_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(visit.visit_date)}
                      </span>
                      {visit.visit_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {visit.visit_time}
                        </span>
                      )}
                    </div>
                    {(visit.visitor_email || visit.visitor_phone) && (
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        {visit.visitor_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {visit.visitor_email}
                          </span>
                        )}
                        {visit.visitor_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {visit.visitor_phone}
                          </span>
                        )}
                      </div>
                    )}
                    {visit.description && (
                      <p className="text-sm text-muted-foreground">{visit.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
