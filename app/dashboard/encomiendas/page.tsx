'use client'

import { useState } from 'react'
import { Package, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ParcelPage() {
  const [parcels] = useState([
    {
      id: '1',
      tracking: 'PKG-2025-001',
      sender: 'Amazon',
      description: 'Laptop Stand',
      status: 'received',
      received_date: '2025-04-08',
    },
    {
      id: '2',
      tracking: 'PKG-2025-002',
      sender: 'DHL',
      description: 'Documents',
      status: 'delivered',
      received_date: '2025-04-06',
    },
  ])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'delivered':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'unclaimed':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Package className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      received: 'Recibido',
      delivered: 'Entregado',
      unclaimed: 'No Reclamado',
      pending: 'Pendiente',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-yellow-50 border-yellow-200'
      case 'delivered':
        return 'bg-green-50 border-green-200'
      case 'unclaimed':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Encomiendas</h1>
        <p className="text-muted-foreground">Gestiona tus paquetes y entregas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Paquetes Recibidos</p>
              <p className="text-2xl font-bold">{parcels.filter(p => p.status === 'received').length}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500 opacity-20" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Entregados</p>
              <p className="text-2xl font-bold">{parcels.filter(p => p.status === 'delivered').length}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500 opacity-20" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{parcels.length}</p>
            </div>
            <Package className="h-8 w-8 text-primary opacity-20" />
          </div>
        </div>
      </div>

      {/* Parcels List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Mis Encomiendas</h2>
        <div className="space-y-3">
          {parcels.map((parcel) => (
            <div key={parcel.id} className={`rounded-lg border p-4 ${getStatusColor(parcel.status)}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">
                    {getStatusIcon(parcel.status)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{parcel.description}</h3>
                    <p className="text-sm text-muted-foreground">De: {parcel.sender}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tracking: {parcel.tracking}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(parcel.received_date).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-white/50">
                    {getStatusLabel(parcel.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="font-semibold">¿Tienes un nuevo paquete?</h2>
        <p className="text-sm text-muted-foreground">
          Contacta con la administración del condominio para registrar tu paquete.
        </p>
        <Button>Solicitar Seguimiento</Button>
      </div>
    </div>
  )
}
