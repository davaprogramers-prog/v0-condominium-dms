'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { useTheme } from '@/app/dashboard/theme-context'
import { editParcelReception } from './actions'

interface Parcel {
  id: string
  parcel_type: string
  from_sender: string
  house_id: string
  house?: { house_number: string }
}

export function EditReceptionDialog({
  parcel,
  houses,
  onClose,
  onSuccess,
}: {
  parcel: Parcel
  houses: Array<{ id: string; house_number: string }>
  onClose: () => void
  onSuccess: () => void
}) {
  const { cardBgColor, cardTextColor, inputBgColor, inputTextColor } = useTheme()
  const [formData, setFormData] = useState({
    parcel_type: parcel.parcel_type || 'paquete',
    from: parcel.from_sender || '',
    house_id: parcel.house_id || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.house_id) {
      alert('Selecciona una propiedad')
      return
    }

    if (!formData.from) {
      alert('Ingresa el remitente')
      return
    }

    setLoading(true)
    try {
      const result = await editParcelReception({
        parcel_id: parcel.id,
        parcel_type: formData.parcel_type,
        from: formData.from,
        house_id: formData.house_id,
      })

      if (result.success) {
        onSuccess()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('[v0] Error editing parcel:', error)
      alert('Error al editar encomienda')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md"
        style={{
          backgroundColor: cardBgColor || '#ffffff',
          color: cardTextColor || '#000000',
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: cardTextColor || '#000000' }}>Editar Recepción</DialogTitle>
          <DialogDescription style={{ color: cardTextColor || '#000000' }}>
            Actualiza los detalles de esta encomienda
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Parcel Type */}
          <div className="space-y-2">
            <Label htmlFor="type" style={{ color: cardTextColor || '#000000' }}>
              Tipo de Encomienda
            </Label>
            <Select
              value={formData.parcel_type}
              onValueChange={(value) =>
                setFormData({ ...formData, parcel_type: value })
              }
            >
              <SelectTrigger
                style={{
                  backgroundColor: inputBgColor,
                  color: inputTextColor,
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paquete">Paquete</SelectItem>
                <SelectItem value="documento">Documento</SelectItem>
                <SelectItem value="sobre">Sobre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* From Sender */}
          <div className="space-y-2">
            <Label htmlFor="from" style={{ color: cardTextColor || '#000000' }}>
              Remitente
            </Label>
            <Input
              id="from"
              placeholder="Ej: Correos de Chile, DHL, Amazon..."
              value={formData.from}
              onChange={(e) =>
                setFormData({ ...formData, from: e.target.value })
              }
              style={{
                backgroundColor: inputBgColor,
                color: inputTextColor,
              }}
            />
          </div>

          {/* Property */}
          <div className="space-y-2">
            <Label htmlFor="house" style={{ color: cardTextColor || '#000000' }}>
              Propiedad
            </Label>
            <Select
              value={formData.house_id}
              onValueChange={(value) =>
                setFormData({ ...formData, house_id: value })
              }
            >
              <SelectTrigger
                style={{
                  backgroundColor: inputBgColor,
                  color: inputTextColor,
                }}
              >
                <SelectValue placeholder="Selecciona propiedad" />
              </SelectTrigger>
              <SelectContent>
                {houses.map((house) => (
                  <SelectItem key={house.id} value={house.id}>
                    Casa #{house.house_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
