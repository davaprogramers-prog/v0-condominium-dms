'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Camera, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { updateParcelStatus } from './actions'

interface ParcelPhoto {
  id: string
  tracking: string
  from: string
  recipient_name: string
  parcel_type: string
  status: 'received' | 'delivered' | 'returned'
  received_date: string
  house_id: string
  house?: { house_number: string }
}

export function UpdateParcelDialog({
  parcel,
  onClose,
  onSuccess,
}: {
  parcel: ParcelPhoto
  onClose: () => void
  onSuccess: () => void
}) {
  const [newStatus, setNewStatus] = useState<'delivered' | 'returned'>('delivered')
  const [returnReason, setReturnReason] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const router = useRouter()

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
      }
    } catch (error) {
      console.error('[v0] Error accessing camera:', error)
      alert('No se pudo acceder a la cámara')
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
            setPhoto(file)
            setPhotoPreview(canvasRef.current!.toDataURL('image/jpeg'))
            stopCamera()
          }
        }, 'image/jpeg')
      }
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      setCameraActive(false)
    }
  }

  const handleSubmit = async () => {
    if (!photo) {
      alert('Por favor captura o sube una foto')
      return
    }

    if (newStatus === 'returned' && !returnReason) {
      alert('Por favor ingresa el motivo de devolución')
      return
    }

    setLoading(true)
    try {
      const photoBuffer = await photo.arrayBuffer()

      const result = await updateParcelStatus({
        parcel_id: parcel.id,
        new_status: newStatus,
        return_reason: newStatus === 'returned' ? returnReason : undefined,
        photo: photoBuffer,
      })

      if (result.success) {
        onSuccess()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('[v0] Error updating parcel:', error)
      alert('Error al actualizar la encomienda')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Actualizar Estado de Encomienda</DialogTitle>
          <DialogDescription>
            {parcel.tracking} - {parcel.recipient_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">Nuevo Estado</Label>
            <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delivered">Entregado</SelectItem>
                <SelectItem value="returned">Devuelto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Return Reason - Only show if returning */}
          {newStatus === 'returned' && (
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo de Devolución</Label>
              <Textarea
                id="reason"
                placeholder="Ej: Ya no vive en el condominio, Rechazó la encomienda..."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="min-h-24"
              />
            </div>
          )}

          {/* Photo Section */}
          <div className="space-y-2">
            <Label>Foto de {newStatus === 'delivered' ? 'Entrega' : 'Devolución'}</Label>

            {photoPreview ? (
              <div className="relative rounded-lg border p-4">
                <img src={photoPreview} alt="Foto" className="w-full max-h-96 object-cover rounded" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setPhoto(null)
                    setPhotoPreview('')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : cameraActive ? (
              <div className="space-y-2">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg border bg-black"
                />
                <canvas ref={canvasRef} className="hidden" width="640" height="480" />
                <div className="flex gap-2">
                  <Button onClick={capturePhoto} className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    Capturar
                  </Button>
                  <Button onClick={stopCamera} variant="outline" className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button onClick={startCamera} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Abrir Cámara
                </Button>
                <label className="flex-1">
                  <Button asChild variant="outline" className="w-full">
                    <span>Subir Foto</span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !photo}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Actualizar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
