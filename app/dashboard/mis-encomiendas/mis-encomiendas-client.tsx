'use client'

import { useState, useMemo } from 'react'
import { Package, Clock, CheckCircle2, Camera, X, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useTheme } from '@/app/dashboard/theme-context'

interface Parcel {
  id: string
  parcel_type: string
  sender: string
  tracking_number?: string
  status: 'recibido' | 'entregado'
  received_at: string
  delivered_at?: string
  notes?: string
  reception_photo_url?: string
  delivery_photo_url?: string
  received_by?: string
}

interface MisEncomiendasClientProps {
  parcels: Parcel[]
  photoCounts: Record<string, number>
  houseId: string
  condoId: string
  houseNumber: string
}

export default function MisEncomiendasClient({
  parcels,
  photoCounts,
  houseId,
  condoId,
  houseNumber,
}: MisEncomiendasClientProps) {
  const { cardBgColor, cardTextColor } = useTheme()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'recibido' | 'entregado'>('all')

  // Filter parcels
  const filteredParcels = useMemo(() => {
    let filtered = parcels || []

    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.parcel_type.toLowerCase().includes(query) ||
        p.sender.toLowerCase().includes(query) ||
        p.tracking_number?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [parcels, searchQuery, filterStatus])

  const pendingCount = parcels.filter(p => p.status === 'recibido').length
  const deliveredCount = parcels.filter(p => p.status === 'entregado').length
  const totalCount = parcels.length

  const clearFilters = () => {
    setSearchQuery('')
    setFilterStatus('all')
  }

  const hasActiveFilters = searchQuery || filterStatus !== 'all'

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'recibido':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pendiente de Retirar</Badge>
      case 'entregado':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Entregado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getParcelTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'sobre':
        return '📧'
      case 'paquete':
        return '📦'
      case 'caja':
        return '📦'
      case 'documento':
        return '📄'
      default:
        return '📦'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="h-8 w-8 text-purple-500" />
            Mis Encomiendas
          </h1>
          <p className="text-muted-foreground mt-1">
            Encomiendas de Casa #{houseNumber}
          </p>
        </div>
      </div>

      {/* Alert for pending parcels */}
      {pendingCount > 0 && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-700">Tienes {pendingCount} encomienda{pendingCount > 1 ? 's' : ''} pendiente{pendingCount > 1 ? 's' : ''} de retirar</p>
              <p className="text-sm text-yellow-600">Acércate a la conserjería para recoger tus paquetes</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Por Retirar</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500 opacity-20" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Entregados</p>
              <p className="text-2xl font-bold">{deliveredCount}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500 opacity-20" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
            <Package className="h-8 w-8 text-primary opacity-20" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4 bg-secondary/20 p-4 rounded-lg border">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Buscar por tipo, remitente, tracking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-2 h-10"
            >
              <X className="h-4 w-4" />
              Limpiar
            </Button>
          )}
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
            variant={filterStatus === 'recibido' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('recibido')}
            className="flex items-center gap-2"
            size="sm"
          >
            <Clock className="h-4 w-4" />
            Por Retirar ({pendingCount})
          </Button>
          <Button
            variant={filterStatus === 'entregado' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('entregado')}
            className="flex items-center gap-2"
            size="sm"
          >
            <CheckCircle2 className="h-4 w-4" />
            Entregados ({deliveredCount})
          </Button>
        </div>
      </div>

      {/* Parcels List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Historial de Encomiendas</h2>
        {filteredParcels.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay encomiendas registradas</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cuando lleguen paquetes a tu nombre, aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredParcels.map((parcel) => (
              <div
                key={parcel.id}
                className="rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                style={{ backgroundColor: cardBgColor, color: cardTextColor }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getParcelTypeIcon(parcel.parcel_type)}</span>
                      <h3 className="font-semibold capitalize">{parcel.parcel_type}</h3>
                      {getStatusBadge(parcel.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        De: {parcel.sender}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Recibido: {formatDate(parcel.received_at)}
                      </span>
                      {parcel.tracking_number && (
                        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                          #{parcel.tracking_number}
                        </span>
                      )}
                    </div>
                    {parcel.status === 'entregado' && parcel.delivered_at && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Entregado: {formatDate(parcel.delivered_at)}
                      </p>
                    )}
                    {parcel.notes && (
                      <p className="text-sm text-muted-foreground">{parcel.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {photoCounts[parcel.id] > 0 && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Camera className="h-3 w-3" />
                        {photoCounts[parcel.id]}
                      </Badge>
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
