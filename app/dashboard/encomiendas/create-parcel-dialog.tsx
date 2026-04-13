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
import { useTheme } from '@/app/dashboard/theme-context'

export function CreateParcelDialog({ condoId, houses, onSuccess }: { condoId: string; houses: Array<{ id: string; house_number: string }>; onSuccess?: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { cardBgColor, cardTextColor, inputBgColor, inputTextColor, primaryColor } = useTheme()
  const [formData, setFormData] = useState({
    house_id: '',
    parcel_type: 'package',
    from: '',
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
      <DialogContent 
        className="max-w-2xl max-h-screen overflow-y-auto"
        style={{
          backgroundColor: cardBgColor || '#ffffff',
          color: cardTextColor || '#000000',
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: cardTextColor || '#000000' }}>Registrar Nueva Encomienda</DialogTitle>
          <DialogDescription style={{ color: cardTextColor || '#000000' }}>
            Registra la recepción de una encomienda en garita
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Selection */}
          <div className="space-y-2">
            <Label htmlFor="house_id" style={{ color: cardTextColor || '#000000' }}>Propiedad Destinataria *</Label>
            <Select value={formData.house_id} onValueChange={(value) => setFormData({ ...formData, house_id: value })}>
              <SelectTrigger 
                id="house_id"
                className="!bg-opacity-100"
                style={{ 
                  backgroundColor: `${inputBgColor || '#f5f5f5'} !important`, 
                  color: `${inputTextColor || '#000000'} !important`, 
                  borderColor: `${cardTextColor || '#ccc'} !important`,
                  border: `1px solid ${cardTextColor || '#ccc'}`
                }}
              >
                <SelectValue placeholder="Selecciona una propiedad" />
              </SelectTrigger>
              <SelectContent 
                className="!bg-opacity-100"
                style={{
                  backgroundColor: `${inputBgColor || '#f5f5f5'} !important`,
                  color: `${inputTextColor || '#000000'} !important`
                }}
              >
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
            <Label htmlFor="parcel_type" style={{ color: cardTextColor || '#000000' }}>Tipo de Encomienda *</Label>
            <Select value={formData.parcel_type} onValueChange={(value) => setFormData({ ...formData, parcel_type: value })}>
              <SelectTrigger 
                id="parcel_type"
                className="!bg-opacity-100"
                style={{ 
                  backgroundColor: `${inputBgColor || '#f5f5f5'} !important`, 
                  color: `${inputTextColor || '#000000'} !important`, 
                  borderColor: `${cardTextColor || '#ccc'} !important`,
                  border: `1px solid ${cardTextColor || '#ccc'}`
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent 
                className="!bg-opacity-100"
                style={{
                  backgroundColor: `${inputBgColor || '#f5f5f5'} !important`,
                  color: `${inputTextColor || '#000000'} !important`
                }}
              >
                <SelectItem value="envelope">Sobre</SelectItem>
                <SelectItem value="package">Paquete</SelectItem>
                <SelectItem value="box">Caja</SelectItem>
                <SelectItem value="tube">Tubo</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* From (Delivery Company) */}
          <div className="space-y-2">
            <Label htmlFor="from" style={{ color: cardTextColor || '#000000' }}>Empresa que Entrega *</Label>
            <Input
              id="from"
              placeholder="Amazon, DHL, Correos, etc"
              value={formData.from}
              onChange={(e) => setFormData({ ...formData, from: e.target.value })}
              style={{ backgroundColor: inputBgColor || '#f5f5f5', color: inputTextColor || '#000000', borderColor: cardTextColor || '#ccc' }}
              required
            />
          </div>

          {/* Reception Photo */}
          <div className="space-y-2">
            <Label style={{ color: cardTextColor || '#000000' }}>Foto de Recepción en Garita *</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center" style={{ borderColor: cardTextColor || '#ccc' }}>
              {receptionPhotoPreview ? (
                <div className="space-y-2">
                  <img src={receptionPhotoPreview} alt="Preview" className="max-h-48 mx-auto rounded" />
                  <button
                    type="button"
                    onClick={() => {
                      setReceptionPhoto(null)
                      setReceptionPhotoPreview('')
                    }}
                    className="text-sm hover:underline"
                    style={{ color: primaryColor || '#0066cc' }}
                  >
                    Cambiar foto
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <div className="flex flex-col items-center gap-2 py-6">
                    <Camera className="h-8 w-8" style={{ color: primaryColor || '#0066cc' }} />
                    <span style={{ color: cardTextColor || '#000000' }}>Tomar o subir foto</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setReceptionPhoto(file)
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setReceptionPhotoPreview(reader.result as string)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                    className="hidden"
                    required
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
            <Button type="submit" disabled={loading} style={{ backgroundColor: primaryColor || '#0066cc' }}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Encomienda
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
