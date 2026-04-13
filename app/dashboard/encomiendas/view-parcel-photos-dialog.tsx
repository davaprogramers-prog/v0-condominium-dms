'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ImageOff, ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'

interface ParcelPhoto {
  id: string
  photo_url: string
  photo_type: 'recepcion_garita' | 'entrega_propietario' | 'devolucion'
  created_at: string
}

interface ViewParcelPhotosDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  parcelId: string
  status: 'recibido' | 'entregado' | 'devuelto'
  photos: ParcelPhoto[]
}

const photoTypeLabels: Record<string, string> = {
  recepcion_garita: 'Foto de Recepción en Garita',
  entrega_propietario: 'Foto de Entrega',
  devolucion: 'Foto de Devolución',
}

export function ViewParcelPhotosDialog({
  isOpen,
  onOpenChange,
  parcelId,
  status,
  photos,
}: ViewParcelPhotosDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!photos || photos.length === 0) {
    return null
  }

  const currentPhoto = photos[currentIndex]

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length)
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fotos de Encomienda</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Photo */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
            {currentPhoto.photo_url ? (
              <img
                src={currentPhoto.photo_url}
                alt={photoTypeLabels[currentPhoto.photo_type]}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400">
                <ImageOff className="h-12 w-12 mb-2" />
                <span>Foto no disponible</span>
              </div>
            )}
          </div>

          {/* Photo Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900">
              {photoTypeLabels[currentPhoto.photo_type]}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              {new Date(currentPhoto.created_at).toLocaleString('es-ES')}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={photos.length <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} de {photos.length}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={photos.length <= 1}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Thumbnails */}
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    index === currentIndex
                      ? 'border-blue-500 bg-blue-100'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <img
                    src={photo.photo_url}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
