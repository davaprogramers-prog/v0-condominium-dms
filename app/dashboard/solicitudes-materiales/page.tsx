import { Metadata } from 'next'
import { ChevronLeft, CheckCircle, AlertCircle, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAdminSupplyRequests } from '../visitas-admin/actions'

export const metadata: Metadata = {
  title: 'Solicitudes de Materiales | Admin | Condominio',
  description: 'Gestión de solicitudes de materiales del conserje',
}

export default async function AdminSolicitudesPage() {
  const requests = await getAdminSupplyRequests()

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 sticky top-0 z-10">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="md:hidden">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-semibold">Solicitudes de Materiales</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-4">
          <div className="space-y-4">
            {requests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay solicitudes de materiales</p>
                </CardContent>
              </Card>
            ) : (
              requests.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{request.request_title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Solicitado por: {request.created_by_profile?.name}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority === 'urgent' && 'Urgente'}
                          {request.priority === 'high' && 'Alta'}
                          {request.priority === 'normal' && 'Normal'}
                          {request.priority === 'low' && 'Baja'}
                        </Badge>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status === 'pending' && 'Pendiente'}
                          {request.status === 'approved' && 'Aprobada'}
                          {request.status === 'purchased' && 'Comprada'}
                          {request.status === 'completed' && 'Completada'}
                          {request.status === 'rejected' && 'Rechazada'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground">Categoría</p>
                          <p>{getCategoryLabel(request.request_category)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Descripción</p>
                          <p>{request.request_description}</p>
                        </div>
                        {request.quantity && (
                          <div>
                            <p className="font-medium text-muted-foreground">Cantidad</p>
                            <p>{request.quantity}</p>
                          </div>
                        )}
                        {request.estimated_cost && (
                          <div>
                            <p className="font-medium text-muted-foreground">Costo Estimado</p>
                            <p>${request.estimated_cost.toLocaleString('es-CL')}</p>
                          </div>
                        )}
                      </div>

                      {request.notes && (
                        <div>
                          <p className="font-medium text-muted-foreground text-sm">Notas</p>
                          <p className="text-sm">{request.notes}</p>
                        </div>
                      )}

                      {request.status === 'pending' && (
                        <div className="flex gap-2 pt-4 border-t">
                          <Button size="sm" variant="outline">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Aprobar
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Rechazar
                          </Button>
                        </div>
                      )}

                      {request.status === 'approved' && (
                        <div className="flex gap-2 pt-4 border-t">
                          <Button size="sm" variant="outline">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Vincular a Gasto
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
