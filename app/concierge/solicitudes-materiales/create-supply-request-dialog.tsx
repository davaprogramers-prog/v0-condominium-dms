'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { createSupplyRequest } from '../actions'

export function CreateSupplyRequestDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      await createSupplyRequest({
        requestTitle: formData.get('request_title') as string,
        requestDescription: formData.get('request_description') as string,
        requestCategory: formData.get('request_category') as 'cleaning' | 'materials' | 'supplies' | 'maintenance' | 'other',
        quantity: formData.get('quantity') ? parseInt(formData.get('quantity') as string) : undefined,
        unitPrice: formData.get('unit_price') ? parseFloat(formData.get('unit_price') as string) : undefined,
        estimatedCost: formData.get('estimated_cost') ? parseFloat(formData.get('estimated_cost') as string) : undefined,
        priority: (formData.get('priority') as any) || 'normal',
      })

      setOpen(false)
      e.currentTarget.reset()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Nueva Solicitud
      </Button>

      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Solicitud de Materiales</DialogTitle>
          <DialogDescription>Crea una solicitud para materiales, suministros o mantenimiento</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="request_title">Título *</Label>
            <Input
              id="request_title"
              name="request_title"
              placeholder="Ej: Escobas para garita"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="request_description">Descripción *</Label>
            <Textarea
              id="request_description"
              name="request_description"
              placeholder="Detalles de lo que necesitas..."
              className="min-h-[80px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="request_category">Categoría *</Label>
            <Select name="request_category" required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona categoría" />
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

          <div className="space-y-2">
            <Label htmlFor="priority">Prioridad</Label>
            <Select name="priority">
              <SelectTrigger>
                <SelectValue defaultValue="normal" placeholder="Normal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_price">Precio Unit.</Label>
              <Input
                id="unit_price"
                name="unit_price"
                type="number"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimated_cost">Costo Estimado</Label>
            <Input
              id="estimated_cost"
              name="estimated_cost"
              type="number"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Crear Solicitud
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
