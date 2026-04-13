'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Plus, Camera, Loader2 } from 'lucide-react'
import { createParcel } from './actions'
import { useRouter } from 'next/navigation'

export function CreateParcelDialog({ condoId, houses, onSuccess }: { condoId: string; houses: Array<{ id: string; house_number: string }>; onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    house_id: '',
    parcel_type: 'package',
    from: '',
    tracking: '',
    recipient_name: '',
    description: '',
    weight: '',
    dimensions: '',
  })
  const [receptionPhoto, setReceptionPhoto] = useState<File | null>(null)
  const [receptionPhotoPreview, setReceptionPhotoPreview] = useState<string>('')
  const router = useRouter()

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setReceptionPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setReceptionPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.house_id) {
      alert('Selecciona una propiedad')
      return
    }

    setLoading(true)
    try {
      const result = await createParcel({
        ...formData,
        condo_id: condoId,
        receptionPhoto: receptionPhoto ? await receptionPhoto.arrayBuffer() : undefined,
      })

      if (result.success) {
        setFormData({
          house_id: '',
          parcel_type: 'package',
          from: '',
          tracking: '',
          recipient_name: '',
          description: '',
          weight: '',
          dimensions: '',
        })
        setReceptionPhoto(null)
        setReceptionPhotoPreview('')
        setOpen(false)
        router.refresh()
        onSuccess?.()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (err) {
      alert('Error al crear encomienda: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Crear Encomienda
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Encomienda</DialogTitle>
          <DialogDescription>
            Registra una encomienda con tipo, destinatario y foto de recepción
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Selection */}
          <div className="space-y-2">
            <Label htmlFor="house_id">Propiedad Destinataria *</Label>
            <Select value={formData.house_id} onValueChange={(value) => setFormData({ ...formData, house_id: value })}>
              <SelectTrigger id="house_id">
                <SelectValue placeholder="Selecciona una propiedad" />
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

          {/* Parcel Type */}
          <div className="space-y-2">
            <Label htmlFor="parcel_type">Tipo de Encomienda *</Label>
            <Select value={formData.parcel_type} onValueChange={(value) => setFormData({ ...formData, parcel_type: value })}>
              <SelectTrigger id="parcel_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="envelope">Sobre</SelectItem>
                <SelectItem value="package">Paquete</SelectItem>
                <SelectItem value="box">Caja</SelectItem>
                <SelectItem value="tube">Tubo</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* From */}
          <div className="space-y-2">
            <Label htmlFor="from">De (Remitente) *</Label>
            <Input
              id="from"
              placeholder="Amazon, DHL, etc"
              value={formData.from}
              onChange={(e) => setFormData({ ...formData, from: e.target.value })}
              required
            />
          </div>

          {/* Tracking and Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tracking">Número de Tracking</Label>
              <Input
                id="tracking"
                placeholder="PKG-2025-001"
                value={formData.tracking}
                onChange={(e) => setFormData({ ...formData, tracking: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="0.5"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
            </div>
          </div>

          {/* Recipient Name and Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipient_name">Nombre del Destinatario</Label>
              <Input
                id="recipient_name"
                placeholder="Nombre completo del propietario"
                value={formData.recipient_name}
                onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dimensions">Dimensiones (opcional)</Label>
              <Input
                id="dimensions"
                placeholder="20x15x10 cm"
                value={formData.dimensions}
                onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              placeholder="Descripción del contenido (opcional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Reception Photo */}
          <div className="space-y-2">
            <Label htmlFor="reception_photo">Foto de Recepción en Garita</Label>
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center">
              {receptionPhotoPreview ? (
                <div className="space-y-2">
                  <img src={receptionPhotoPreview} alt="Preview" className="max-h-32 mx-auto rounded" />
                  <button
                    type="button"
                    onClick={() => {
                      setReceptionPhoto(null)
                      setReceptionPhotoPreview('')
                    }}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Cambiar foto
                  </button>
                </div>
              ) : (
                <label htmlFor="reception_photo" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Camera className="h-6 w-6 text-blue-500" />
                    <span className="text-sm text-gray-600">Tomar o subir foto de recepción</span>
                  </div>
                  <input
                    id="reception_photo"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Encomienda
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
