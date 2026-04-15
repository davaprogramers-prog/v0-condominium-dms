'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTheme } from '../theme-context'
import { ChevronLeft, Plus, Edit2, Trash2, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Calendar, Grid2X2, Layout, LayoutGrid } from 'lucide-react'
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
  staff: any[]
  isAdmin: boolean
  userRole: string
}

export function SolicitudesClient({ condoId, solicitudes, staff, isAdmin, userRole }: SolicitudesClientProps) {
  const [openCreate, setOpenCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null)
  const [searchRequestedBy, setSearchRequestedBy] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [formData, setFormData] = useState({
    request_title: '',
    requested_by_name: '',
    items: [{ quantity: '', description: '' }],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { dialogBgColor, dialogTextColor, inputBgColor, inputTextColor, cardBgColor, cardTextColor } = useTheme()

  // Filter solicitudes based on criteria
  const filteredSolicitudes = useMemo(() => {
    return solicitudes.filter((request) => {
      // Filter by status
      if (statusFilter && request.status !== statusFilter) {
        return false
      }

      // Filter by requested_by_name
      if (searchRequestedBy) {
        const requestedByLine = request.request_description
          ?.split('\n')[0]
          ?.replace('Solicitado por: ', '')
          ?.toLowerCase() || ''
        if (!requestedByLine.includes(searchRequestedBy.toLowerCase())) {
          return false
        }
      }

      // Filter by date range
      const requestDate = request.created_at
      if (startDate && new Date(requestDate).toISOString().split('T')[0] < startDate) {
        return false
      }
      if (endDate && new Date(requestDate).toISOString().split('T')[0] > endDate) {
        return false
      }

      return true
    })
  }, [solicitudes, statusFilter, searchRequestedBy, startDate, endDate])

  const handleAddLine = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { quantity: '', description: '' }]
    })
  }

  const handleRemoveLine = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      items: newItems.length > 0 ? newItems : [{ quantity: '', description: '' }]
    })
  }

  const handleItemChange = (index: number, field: 'quantity' | 'description', value: string) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    setFormData({
      ...formData,
      items: newItems
    })
  }

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
        requested_by_name: '',
        items: [{ quantity: '', description: '' }],
      })
      setOpenCreate(false)
    } catch (error) {
      console.error('[v0] Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (request: any) => {
    // Parse items from request_description
    const lines = request.request_description?.split('\n') || []

    // Extract requested_by_name from first line
    let requested_by_name = ''
    let itemsText = []

    lines.forEach((line: string) => {
      if (line.includes('Solicitado por:')) {
        requested_by_name = line.replace('Solicitado por: ', '').trim()
      } else if (line.trim() !== '') {
        itemsText.push(line)
      }
    })

    const items = itemsText
      .map((line: string) => {
        const [qty, desc] = line.split(' - ')
        return { quantity: qty?.trim() || '', description: desc?.trim() || '' }
      })

    setFormData({
      request_title: request.request_title,
      requested_by_name,
      items: items.length > 0 ? items : [{ quantity: '', description: '' }],
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Content with scrollable filters */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-4">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Link href="/dashboard" className="md:hidden">
                  <ChevronLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-xl font-semibold">Solicitudes de Materiales</h1>
              </div>
              {(isAdmin || userRole === 'conserje') && (
                <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                  <DialogTrigger asChild>
                    <Button
                      style={{
                        backgroundColor: "#2563eb",
                        color: "white",
                        padding: "12px 24px",
                        fontSize: "16px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        border: "2px solid #1d4ed8",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
                        cursor: "pointer",
                        fontWeight: "600"
                      }}
                    >
                      <LayoutGrid className="h-5 w-5" />
                      Nueva Solicitud
                    </Button>
                  </DialogTrigger>
                  <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }} className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle style={{ color: dialogTextColor }}>{editingId ? 'Editar' : 'Nueva'} Solicitud de Material</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <Label htmlFor="title" style={{ color: dialogTextColor }}>Título</Label>
                        <Input
                          id="title"
                          value={formData.request_title}
                          onChange={(e) => setFormData({ ...formData, request_title: e.target.value })}
                          placeholder="Ej: Compras supermercado"
                          required
                          style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
                        />
                      </div>

                      <div>
                        <Label htmlFor="requested_by" style={{ color: dialogTextColor }}>Solicitado por *</Label>
                        <Input
                          id="requested_by"
                          value={formData.requested_by_name}
                          onChange={(e) => setFormData({ ...formData, requested_by_name: e.target.value })}
                          placeholder="Escribir nombre"
                          required
                          style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
                        />
                        {staff && staff.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Disponibles: {staff.map(s => s.name).join(", ")}
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <Label style={{ color: dialogTextColor }}>Detalle de Productos</Label>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleAddLine}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar línea
                          </Button>
                        </div>

                        <div style={{ backgroundColor: inputBgColor, borderColor: inputTextColor }} className="space-y-3 max-h-64 overflow-y-auto border rounded-lg p-4">
                          {formData.items.map((item, index) => (
                            <div key={index} className="flex gap-3 items-end">
                              <div className="w-24">
                                <Label className="text-xs" style={{ color: dialogTextColor }}>Cantidad</Label>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                  placeholder="1"
                                  required
                                  min="1"
                                  style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
                                />
                              </div>
                              <div className="flex-1">
                                <Label className="text-xs" style={{ color: dialogTextColor }}>Descripción</Label>
                                <Input
                                  value={item.description}
                                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                  placeholder="Producto o material"
                                  required
                                  style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
                                />
                              </div>
                              {formData.items.length > 1 && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive"
                                  onClick={() => handleRemoveLine(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button type="submit" disabled={isSubmitting} className="w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">
                        {isSubmitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Filters - Responsive layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* First row: Search by requestor */}
              <div>
                <label className="text-sm font-medium">Buscar por Solicitante</label>
                <Input
                  placeholder="Nombre del solicitante"
                  value={searchRequestedBy}
                  onChange={(e) => setSearchRequestedBy(e.target.value)}
                  style={{ backgroundColor: cardBgColor, color: cardTextColor, borderColor: inputTextColor }}
                />
              </div>

              {/* First row: Status filter */}
              <div>
                <label className="text-sm font-medium">Estado</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger style={{ backgroundColor: cardBgColor, color: cardTextColor, borderColor: inputTextColor }}>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: cardBgColor }}>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="approved">Aprobada</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                    <SelectItem value="rejected">Rechazada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Second row: Start date */}
              <div>
                <label className="text-sm font-medium">Desde</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ backgroundColor: cardBgColor, color: cardTextColor, borderColor: inputTextColor }}
                />
              </div>

              {/* Second row: End date */}
              <div>
                <label className="text-sm font-medium">Hasta</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ backgroundColor: cardBgColor, color: cardTextColor, borderColor: inputTextColor }}
                />
              </div>

              {/* Clear button - spans full width */}
              <div className="lg:col-span-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusFilter('pending')
                    setStartDate('')
                    setEndDate('')
                    setSearchRequestedBy('')
                  }}
                  className="w-full"
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </div>
          
          {/* Solicitudes list */}
          <div className="space-y-4">
            {filteredSolicitudes.length === 0 ? (
              <Card style={{ backgroundColor: cardBgColor || undefined }}>
                <CardContent className="text-center py-12">
                  <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p style={{ color: dialogTextColor }} className="text-muted-foreground">No hay solicitudes que coincidan con los filtros</p>
                </CardContent>
              </Card>
            ) : (
              filteredSolicitudes.map((request) => (
                <Card key={request.id} style={{ backgroundColor: cardBgColor || undefined }} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader
                    className="pb-3 hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                  >
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle style={{ color: dialogTextColor }} className="text-lg">{request.request_title}</CardTitle>
                          {expandedRequest === request.id ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <p style={{ color: dialogTextColor }} className="text-sm text-muted-foreground mt-1">
                          {new Date(request.created_at).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status === 'pending' && 'Pendiente'}
                        {request.status === 'approved' && 'Aprobada'}
                        {request.status === 'completed' && 'Completada'}
                        {request.status === 'rejected' && 'Rechazada'}
                      </Badge>
                    </div>
                  </CardHeader>

                  {expandedRequest === request.id && (
                    <CardContent style={{ backgroundColor: cardBgColor || undefined, color: cardTextColor || undefined }} className="pt-0">
                      <div className="space-y-4">
                        <div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b" style={{ borderColor: cardTextColor || undefined }}>
                                  <th style={{ color: cardTextColor }} className="text-left py-2 px-3 font-medium">Cantidad</th>
                                  <th style={{ color: cardTextColor }} className="text-left py-2 px-3 font-medium">Descripción</th>
                                </tr>
                              </thead>
                              <tbody>
                                {request.request_description?.split('\n').map((line: string, idx: number) => {
                                  if (!line.trim()) return null
                                  // Skip the "Solicitado por:" line
                                  if (line.includes('Solicitado por:')) return null
                                  const [qty, desc] = line.split(' - ')
                                  return (
                                    <tr key={idx} className="border-b last:border-b-0" style={{ borderColor: cardTextColor || undefined }}>
                                      <td style={{ color: cardTextColor }} className="py-2 px-3">{qty?.trim()}</td>
                                      <td style={{ color: cardTextColor }} className="py-2 px-3">{desc?.trim()}</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="pt-2 pb-4 border-b">
                          <p className="text-sm text-muted-foreground">
                            {request.request_description
                              ?.split('\n')[0]
                              ?.replace('Solicitado por: ', '') && (
                                <>
                                  <span className="font-medium">Solicitado por: </span>
                                  {request.request_description?.split('\n')[0]?.replace('Solicitado por: ', '')}
                                </>
                              )}
                          </p>
                        </div>

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

                          {request.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(request.id, 'completed')}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Marcar Completada
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
