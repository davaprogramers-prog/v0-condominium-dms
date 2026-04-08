'use client'

import { useState } from 'react'
import { ChevronLeft, Plus, Edit2, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createMaterialRequest, updateMaterialRequest, deleteMaterialRequest, updateMaterialRequestStatus } from './actions'

interface SolicitudesClientProps {
  condoId: string
  solicitudes: any[]
  isAdmin: boolean
  userRole: string
}

export function SolicitudesClient({ condoId, solicitudes, isAdmin, userRole }: SolicitudesClientProps) {
  const [openCreate, setOpenCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    request_title: '',
    request_description: '',
    request_category: 'supplies',
    priority: 'normal',
    quantity: '',
    estimated_cost: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingId) {
        await updateMaterialRequest(editingId, formData)
        setEditingId(null)
      } else {
        await createMaterialRequest(condoId, formData)
      }
      setFormData({
        request_title: '',
        request_description: '',
        request_category: 'supplies',
        priority: 'normal',
        quantity: '',
        estimated_cost: '',
        notes: '',
      })
      setOpenCreate(false)
    } catch (error) {
      console.error('[v0] Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (request: any) => {
    setFormData({
      request_title: request.request_title,
      request_description: request.request_description,
      request_category: request.request_category,
      priority: request.priority,
      quantity: request.quantity?.toString() || '',
      estimated_cost: request.estimated_cost?.toString() || '',
      notes: request.notes || '',
    })
    setEditingId(request.id)
    setOpenCreate(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro que deseas eliminar esta solicitud?')) {
      try {
        await deleteMaterialRequest(id)
      } catch (error) {
        console.error('[v0] Error deleting:', error)
      }
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateMaterialRequestStatus(id, status)
    } catch (error) {
      console.error('[v0] Error updating status:', error)
    }
  }

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
          {(isAdmin || userRole === 'conserje') && (
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Solicitud
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Editar' : 'Nueva'} Solicitud de Material</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={formData.request_title}
                      onChange={(e) => setFormData({ ...formData, request_title: e.target.value })}
                      placeholder="Título de la solicitud"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="desc">Descripción</Label>
                    <Textarea
                      id="desc"
                      value={formData.request_description}
                      onChange={(e) => setFormData({ ...formData, request_description: e.target.value })}
                      placeholder="Descripción detallada"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Categoría</Label>
                      <Select value={formData.request_category} onValueChange={(val) => setFormData({ ...formData, request_category: val })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cleaning">Limpieza</SelectItem>
                          <SelectItem value="materials">Materiales</SelectItem>
                          <SelectItem value="supplies">Suministros</SelectItem>
                          <SelectItem value="maintenance">Mantenimiento</SelectItem>
                          <SelectItem value="other">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Prioridad</Label>
                      <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baja</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="qty">Cantidad</Label>
                      <Input
                        id="qty"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cost">Costo Estimado ($)</Label>
                      <Input
                        id="cost"
                        type="number"
                        value={formData.estimated_cost}
                        onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Notas adicionales"
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-4">
          <div className="space-y-4">
            {solicitudes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay solicitudes de materiales</p>
                </CardContent>
              </Card>
            ) : (
              solicitudes.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{request.request_title}</CardTitle>
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

                      <div className="flex gap-2 pt-4 border-t flex-wrap">
                        {request.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStatusChange(request.id, 'approved')}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Aprobar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-destructive"
                              onClick={() => handleStatusChange(request.id, 'rejected')}
                            >
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Rechazar
                            </Button>
                          </>
                        )}

                        {(isAdmin || userRole === 'conserje') && request.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEdit(request)}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-destructive"
                              onClick={() => handleDelete(request.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </Button>
                          </>
                        )}
                      </div>
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
