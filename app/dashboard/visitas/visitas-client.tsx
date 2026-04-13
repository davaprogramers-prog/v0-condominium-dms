'use client'

import { useState, useMemo } from 'react'
import { Calendar, Clock, CheckCircle2, AlertCircle, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  house_id: string
  house?: {
    id: string
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
  const [selectedHouses, setSelectedHouses] = useState<Set<string>>(new Set())
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Helper function to check if a visit is older than 1 day
  const isVisitOlderThanOneDay = (visitDate: string) => {
    const visit = new Date(visitDate)
    const now = new Date()
    const oneDayMs = 24 * 60 * 60 * 1000
    return now.getTime() - visit.getTime() > oneDayMs
  }

  // Filter visits based on search, status, house, and date range
  const filteredVisits = useMemo(() => {
    let filtered = initialVisits || []

    // Hide visits older than 1 day
    filtered = filtered.filter(v => !isVisitOlderThanOneDay(v.visit_date))

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(v => v.status === filterStatus)
    }

    // Filter by selected houses
    if (selectedHouses.size > 0) {
      filtered = filtered.filter(v => selectedHouses.has(v.house_id))
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(v => new Date(v.visit_date) >= new Date(dateFrom))
    }
    if (dateTo) {
      // Add 1 day to include the entire end date
      const endDate = new Date(dateTo)
      endDate.setDate(endDate.getDate() + 1)
      filtered = filtered.filter(v => new Date(v.visit_date) < endDate)
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
  }, [initialVisits, searchQuery, filterStatus, selectedHouses, dateFrom, dateTo])

  // Calculate counts based on filtered data (after hiding old visits)
  const visibleVisits = initialVisits.filter(v => !isVisitOlderThanOneDay(v.visit_date))
  const scheduledCount = visibleVisits.filter(v => v.status === 'scheduled').length
  const completedCount = visibleVisits.filter(v => v.status === 'completed').length
  const cancelledCount = visibleVisits.filter(v => v.status === 'cancelled').length
  const totalCount = visibleVisits.length

  const toggleHouse = (houseId: string) => {
    const newSelected = new Set(selectedHouses)
    if (newSelected.has(houseId)) {
      newSelected.delete(houseId)
    } else {
      newSelected.add(houseId)
    }
    setSelectedHouses(newSelected)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilterStatus('all')
    setSelectedHouses(new Set())
    setDateFrom('')
    setDateTo('')
  }

  const hasActiveFilters = searchQuery || filterStatus !== 'all' || selectedHouses.size > 0 || dateFrom || dateTo

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
      <div className="space-y-4 bg-secondary/20 p-4 rounded-lg border">
        {/* First Row: Search and Dates */}
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

        {/* Second Row: Status Buttons */}
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

        {/* Third Row: Property Filter Dropdown (if viewing as admin) */}
        {isViewingAsAdmin && houses && houses.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
            <span className="text-sm font-medium text-muted-foreground">Propiedades:</span>
            <div className="flex gap-2 items-center w-full sm:w-auto">
              <Select
                value={selectedHouses.size === 0 ? 'all' : Array.from(selectedHouses)[0]}
                onValueChange={(value) => {
                  if (value === 'all') {
                    setSelectedHouses(new Set())
                  } else {
                    setSelectedHouses(new Set([value]))
                  }
                }}
              >
                <SelectTrigger className="w-full sm:w-56 bg-popover">
                  <SelectValue placeholder="Seleccionar propiedad..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las propiedades</SelectItem>
                  {houses.map(house => (
                    <SelectItem key={house.id} value={house.id}>
                      Casa #{house.house_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedHouses.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedHouses(new Set())}
                  className="text-xs"
                >
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <VisitsList visits={filteredVisits} />
    </div>
  )
}
