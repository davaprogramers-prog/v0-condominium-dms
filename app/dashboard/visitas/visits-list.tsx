'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, User, Mail, Phone, Trash2, Check, X, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { deleteVisit, updateVisitStatus } from './actions'

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

interface VisitsListProps {
  visits: Visit[]
}

export function VisitsList({ visits }: VisitsListProps) {
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; visit: Visit | null }>({ open: false, visit: null })
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!deleteDialog.visit) return
    setDeleting(true)
    try {
      await deleteVisit(deleteDialog.visit.id)
      setDeleteDialog({ open: false, visit: null })
      router.refresh()
    } catch (error) {
      console.error('[v0] Error deleting visit:', error)
    } finally {
      setDeleting(false)
    }
  }

  async function handleStatusChange(visitId: string, status: 'completed' | 'cancelled') {
    try {
      await updateVisitStatus(visitId, status)
      router.refresh()
    } catch (error) {
      console.error('[v0] Error updating visit:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Programada'
      case 'completed':
        return 'Completada'
      case 'cancelled':
        return 'Cancelada'
      default:
        return status
    }
  }

  if (visits.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No hay visitas registradas</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {visits.map((visit) => (
          <div key={visit.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{visit.visitor_name}</h3>
                <p className="text-sm text-muted-foreground">{visit.visit_title}</p>
              </div>
              <Badge className={getStatusColor(visit.status)}>
                {getStatusLabel(visit.status)}
              </Badge>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Casa #{visit.house?.house_number}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(visit.visit_date).toLocaleDateString('es-CL')}
                  {visit.visit_time && ` a las ${visit.visit_time.substring(0, 5)}`}
                </span>
              </div>
              {visit.visitor_email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{visit.visitor_email}</span>
                </div>
              )}
              {visit.visitor_phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{visit.visitor_phone}</span>
                </div>
              )}
              {visit.description && (
                <p className="text-muted-foreground italic mt-2">{visit.description}</p>
              )}
            </div>

            {visit.status === 'scheduled' && (
              <div className="flex gap-2 pt-3 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(visit.id, 'completed')}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Completar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(visit.id, 'cancelled')}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setDeleteDialog({ open: true, visit })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !deleting && setDeleteDialog({ open, visit: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Visita</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la visita de {deleteDialog.visit?.visitor_name}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, visit: null })}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
