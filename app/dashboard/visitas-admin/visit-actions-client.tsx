'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit2, Trash2, Loader2 } from 'lucide-react'
import { deleteVisit, updateVisitStatus } from '@/app/dashboard/visitas/actions'

interface VisitActionsClientProps {
  visitId: string
  visitorName: string
  visitData: {
    visitor_name: string
    visit_title: string
    visit_date: string
    visit_time?: string
    visitor_email?: string
    visitor_phone?: string
    description?: string
    status: string
  }
}

export function VisitActionsClient({ visitId, visitorName, visitData }: VisitActionsClientProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [newStatus, setNewStatus] = useState(visitData.status)

  const handleStatusChange = async () => {
    if (newStatus === visitData.status) {
      setEditOpen(false)
      return
    }

    setIsLoading(true)
    try {
      await updateVisitStatus(visitId, newStatus as 'scheduled' | 'completed' | 'cancelled')
      setEditOpen(false)
      router.refresh()
    } catch (error) {
      console.error('[v0] Error updating visit status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      await deleteVisit(visitId)
      setDeleteOpen(false)
      router.refresh()
    } catch (error) {
      console.error('[v0] Error deleting visit:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Edit Status Button */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setEditOpen(true)}
        >
          <Edit2 className="h-4 w-4" />
          Editar Estado
        </Button>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Estado de Visita</DialogTitle>
            <DialogDescription>
              Cambiar estado para {visitorName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Programada</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Button */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Visita</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la visita de {visitorName}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
