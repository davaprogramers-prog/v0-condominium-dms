'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SupplyRequestCardProps {
  request: {
    id: string
    request_title: string
    request_description: string
    request_category: string
    quantity?: number
    unit_price?: number
    estimated_cost?: number
    priority: 'low' | 'normal' | 'high' | 'urgent'
    status: 'pending' | 'approved' | 'purchased' | 'completed' | 'rejected'
    created_at: string
    created_by_profile?: {
      name: string
    }
    notes?: string
  }
}

export function SupplyRequestCard({ request }: SupplyRequestCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'normal':
        return 'bg-blue-100 text-blue-800'
      case 'low':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-blue-100 text-blue-800'
      case 'purchased':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'cleaning': 'Limpieza',
      'materials': 'Materiales',
      'supplies': 'Suministros',
      'maintenance': 'Mantenimiento',
      'other': 'Otro',
    }
    return labels[category] || category
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Pendiente',
      'approved': 'Aprobada',
      'purchased': 'Comprada',
      'completed': 'Completada',
      'rejected': 'Rechazada',
    }
    return labels[status] || status
  }

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      'urgent': 'Urgente',
      'high': 'Alta',
      'normal': 'Normal',
      'low': 'Baja',
    }
    return labels[priority] || priority
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg">{request.request_title}</CardTitle>
            <p className="text-sm text-muted-foreground">{request.request_description}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge className={getPriorityColor(request.priority)}>
              {getPriorityLabel(request.priority)}
            </Badge>
            <Badge className={getStatusColor(request.status)}>
              {getStatusLabel(request.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="font-medium text-muted-foreground">Categoría</p>
            <p>{getCategoryLabel(request.request_category)}</p>
          </div>
          {request.quantity && (
            <div>
              <p className="font-medium text-muted-foreground">Cantidad</p>
              <p>{request.quantity}</p>
            </div>
          )}
          {request.estimated_cost && (
            <div>
              <p className="font-medium text-muted-foreground">Costo Est.</p>
              <p>${request.estimated_cost.toLocaleString('es-CL')}</p>
            </div>
          )}
          <div>
            <p className="font-medium text-muted-foreground">Creado</p>
            <p>{new Date(request.created_at).toLocaleDateString('es-CL')}</p>
          </div>
        </div>
        {request.notes && (
          <div className="mt-3 pt-3 border-t">
            <p className="font-medium text-muted-foreground text-sm">Notas</p>
            <p className="text-sm">{request.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
