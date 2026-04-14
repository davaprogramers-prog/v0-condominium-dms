'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ImageOff, ChevronLeft, ChevronRight, Loader } from 'lucide-react'

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
  loadPhotos: (parcelId: string) => Promise<ParcelPhoto[]>
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
  loadPhotos,
}: ViewParcelPhotosDialogProps) {
  const [photos, setPhotos] = useState<ParcelPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  useEffect(() => {
    if (isOpen) {
      loadPhotosData()
    }
  }, [isOpen, parcelId])

  const loadPhotosData = async () => {
    setLoading(true)
    try {
      const fetchedPhotos = await loadPhotos(parcelId)
      console.log('[v0] View dialog - Fetched photos for parcel:', { parcelId, count: fetchedPhotos.length, photos: fetchedPhotos })
      setPhotos(fetchedPhotos)
      setCurrentPhotoIndex(0)
    } catch (error) {
      console.error('[v0] View dialog - Error loading photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
  }

  const handlePrevious = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fotos de Encomienda</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="bg-gray-100 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              <div className="flex flex-col items-center justify-center text-gray-400">
                <Loader className="h-8 w-8 animate-spin mb-2" />
                <span>Cargando fotos...</span>
              </div>
            </div>
          ) : photos.length === 0 ? (
            <div className="bg-gray-100 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              <div className="flex flex-col items-center justify-center text-gray-400">
                <ImageOff className="h-12 w-12 mb-2" />
                <span>No hay fotos disponibles</span>
              </div>
            </div>
          ) : (
            <>
              {/* Current Photo */}
              <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                <img
                  src={photos[currentPhotoIndex].photo_url}
                  alt={photoTypeLabels[photos[currentPhotoIndex].photo_type]}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('[v0] Image failed to load')
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      const errorDiv = document.createElement('div')
                      errorDiv.className = 'flex flex-col items-center justify-center text-gray-400 w-full h-full'
                      errorDiv.innerHTML = `<svg class="h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span>No se pudo cargar la imagen</span>`
                      parent.appendChild(errorDiv)
                    }
                  }}
                />
              </div>

              {/* Photo Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900">
                  {photoTypeLabels[photos[currentPhotoIndex].photo_type]}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {typeof photos[currentPhotoIndex].created_at === 'string'
                    ? photos[currentPhotoIndex].created_at.split('T').join(' ').slice(0, 19)
                    : new Date(photos[currentPhotoIndex].created_at).toISOString().split('T').join(' ').slice(0, 19)
                  }
                </p>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  size="sm"
                  onClick={handlePrevious}
                  disabled={photos.length <= 1}
                  className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold border-2 border-amber-500"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>

                <span className="text-sm font-semibold text-gray-700">
                  {currentPhotoIndex + 1} de {photos.length}
                </span>

                <Button
                  size="sm"
                  onClick={handleNext}
                  disabled={photos.length <= 1}
                  className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold border-2 border-amber-500"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {/* Thumbnails */}
              {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {photos.map((photo, index) => (
                    <button
                      key={photo.id}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === currentPhotoIndex
                          ? 'border-blue-500 bg-blue-100'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <img
                        src={photo.photo_url}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            const errorDiv = document.createElement('div')
                            errorDiv.className = 'flex items-center justify-center text-gray-300 text-xs w-full h-full bg-gray-100'
                            errorDiv.textContent = '✕'
                            parent.appendChild(errorDiv)
                          }
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
