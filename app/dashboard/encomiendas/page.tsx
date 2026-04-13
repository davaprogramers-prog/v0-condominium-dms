'use client'

import { useState, useEffect } from 'react'
import { Package, AlertCircle, CheckCircle2, Clock, Plus, Edit, Trash, Camera, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { CreateParcelDialog } from './create-parcel-dialog'
import { UpdateParcelDialog } from './update-parcel-dialog'
import { ViewParcelPhotosDialog } from './view-parcel-photos-dialog'

interface ParcelPhoto {
  id: string
  photo_url: string
  photo_type: 'recepcion_garita' | 'entrega_propietario' | 'devolucion'
  created_at: string
}

interface Parcel {
  id: string
  from_sender: string
  parcel_type: string
  status: 'recibido' | 'entregado' | 'devuelto'
  received_date: string
  delivered_date?: string
  house_id: string
  house?: { house_number: string }
  return_reason?: string
  photos?: ParcelPhoto[]
}

export default function ParcelPage() {
  const supabase = createClient()
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [role, setRole] = useState<string>('')
  const [condoId, setCondoId] = useState<string>('')
  const [houseId, setHouseId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showDelivered, setShowDelivered] = useState(false)
  const [searchTracking, setSearchTracking] = useState('')
  const [editingParcel, setEditingParcel] = useState<Parcel | null>(null)
  const [viewingPhotosParcel, setViewingPhotosParcel] = useState<Parcel | null>(null)
  const [houses, setHouses] = useState<Array<{ id: string; house_number: string }>>([])

  useEffect(() => {
    loadUserAndParcels()
  }, [])

  const loadUserAndParcels = async () => {
    try {
      // Get user profile
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, condo_id, house_id')
        .eq('id', user.id)
        .single()

      if (!profile) return

      setRole(profile.role)
      setCondoId(profile.condo_id)
      setHouseId(profile.house_id)

      // Get houses for dropdown
      const { data: housesData } = await supabase
        .from('houses')
        .select('id, house_number')
        .eq('condo_id', profile.condo_id)
        .order('house_number', { ascending: true })

      setHouses(housesData || [])

      // Get parcels based on role
      let query = supabase
        .from('parcels')
        .select('*, house:houses(house_number)')
        .eq('condo_id', profile.condo_id)

      // Filter by role
      if (profile.role === 'conserje' || profile.role === 'admin' || profile.role === 'super_admin') {
        // Conserjes and admins see all parcels
        query = query.order('received_date', { ascending: false })
      } else {
        // Owners only see their own parcels
        query = query.eq('house_id', profile.house_id).order('received_date', { ascending: false })
      }

      const { data } = await query

      // Fetch photos for each parcel
      if (data && data.length > 0) {
        const { data: photosData } = await supabase
          .from('parcel_photos')
          .select('id, parcel_id, photo_url, photo_type, created_at')
          .in('parcel_id', data.map(p => p.id))

        // Group photos by parcel_id
        const photosByParcelId: Record<string, ParcelPhoto[]> = {}
        if (photosData) {
          photosData.forEach((photo: any) => {
            if (!photosByParcelId[photo.parcel_id]) {
              photosByParcelId[photo.parcel_id] = []
            }
            photosByParcelId[photo.parcel_id].push({
              id: photo.id,
              photo_url: photo.photo_url,
              photo_type: photo.photo_type,
              created_at: photo.created_at,
            })
          })
        }

        // Add photos to parcels
        const dataWithPhotos = data.map(p => ({
          ...p,
          photos: photosByParcelId[p.id] || []
        }))
        
        // Filter out delivered parcels unless showDelivered is true
        let filtered = dataWithPhotos
        if (!showDelivered) {
          filtered = filtered.filter(p => p.status !== 'entregado')
        }

        // Apply search filter
        if (searchTracking) {
          filtered = filtered.filter(p =>
            p.from_sender?.toLowerCase().includes(searchTracking.toLowerCase())
          )
        }

        setParcels(filtered)
      } else {
        setParcels([])
      }
    } catch (error) {
      console.error('[v0] Error loading parcels:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setLoading(true)
    loadUserAndParcels()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'recibido':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'entregado':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'devuelto':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Package className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      recibido: 'Recibido',
      entregado: 'Entregado',
      devuelto: 'Devuelto',
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recibido':
        return 'bg-yellow-50 border-yellow-200'
      case 'entregado':
        return 'bg-green-50 border-green-200'
      case 'devuelto':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const isConserje = role === 'conserje' || role === 'admin' || role === 'super_admin'
  const receivedCount = parcels.filter(p => p.status === 'recibido').length
  const deliveredCount = parcels.filter(p => p.status === 'entregado').length
  const totalCount = receivedCount + deliveredCount

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Encomiendas</h1>
          <p className="text-muted-foreground">
            {isConserje ? 'Gestiona las encomiendas del condominio' : 'Tus paquetes y entregas'}
          </p>
        </div>
        {isConserje && <CreateParcelDialog condoId={condoId} houses={houses} onSuccess={handleRefresh} />}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Paquetes Recibidos</p>
              <p className="text-2xl font-bold">{receivedCount}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500 opacity-20" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Entregados</p>
              <p className="text-2xl font-bold">{deliveredCount}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500 opacity-20" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
            <Package className="h-8 w-8 text-primary opacity-20" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Buscar por tracking o remitente..."
          value={searchTracking}
          onChange={(e) => setSearchTracking(e.target.value)}
          className="flex-1"
        />
        <Button
          variant={showDelivered ? 'default' : 'outline'}
          onClick={() => setShowDelivered(!showDelivered)}
          className="flex items-center gap-2"
        >
          {showDelivered ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          {showDelivered ? 'Ocultar' : 'Mostrar'} Entregadas
        </Button>
      </div>

      {/* Parcels List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{isConserje ? 'Encomiendas del Condominio' : 'Mis Encomiendas'}</h2>
        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : parcels.length === 0 ? (
          <p className="text-muted-foreground">No hay encomiendas</p>
        ) : (
          <div className="space-y-3">
            {parcels.map((parcel) => (
              <div key={parcel.id} className={`rounded-lg border p-4 ${getStatusColor(parcel.status)}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">{getStatusIcon(parcel.status)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{parcel.parcel_type}</h3>
                        {isConserje && parcel.house && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Casa #{parcel.house.house_number}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">De: {parcel.from_sender}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(parcel.received_date).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-white/50">
                      {getStatusLabel(parcel.status)}
                    </span>
                    {parcel.photos && parcel.photos.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingPhotosParcel(parcel)}
                        className="flex items-center gap-2"
                        title="Ver fotos de la encomienda"
                      >
                        <Camera className="h-4 w-4" />
                        {parcel.photos.length}
                      </Button>
                    )}
                    {isConserje && parcel.status === 'recibido' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingParcel(parcel)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                {parcel.return_reason && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                    Motivo devolución: {parcel.return_reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Update Dialog */}
      {editingParcel && (
        <UpdateParcelDialog
          parcel={editingParcel}
          onClose={() => setEditingParcel(null)}
          onSuccess={() => {
            setEditingParcel(null)
            handleRefresh()
          }}
        />
      )}

      {/* View Photos Dialog */}
      {viewingPhotosParcel && (
        <ViewParcelPhotosDialog
          isOpen={!!viewingPhotosParcel}
          onOpenChange={(open) => !open && setViewingPhotosParcel(null)}
          parcelId={viewingPhotosParcel.id}
          status={viewingPhotosParcel.status}
          photos={viewingPhotosParcel.photos || []}
        />
      )}
    </div>
  )
}
