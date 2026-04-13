'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '../theme-context'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Loader2, Lock } from 'lucide-react'
import { createVisit } from './actions'

interface House {
  id: string
  house_number: string
}

interface CreateVisitDialogProps {
  houses: House[]
  houseId?: string
}

export function CreateVisitDialog({ houses, houseId }: CreateVisitDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedHouseId, setSelectedHouseId] = useState(houseId || '')
  const router = useRouter()
  const { dialogBgColor, dialogTextColor, inputBgColor, inputTextColor } = useTheme()

  // If owner has only one house, pre-select it
  useEffect(() => {
    if (houses.length === 1) {
      setSelectedHouseId(houses[0].id)
    } else if (houseId) {
      setSelectedHouseId(houseId)
    }
  }, [houses, houseId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      await createVisit({
        houseId: selectedHouseId || (formData.get('house_id') as string),
        visitorName: formData.get('visitor_name') as string,
        visitTitle: formData.get('visit_title') as string,
        visitDate: formData.get('visit_date') as string,
        visitTime: (formData.get('visit_time') as string) || undefined,
        visitorEmail: (formData.get('visitor_email') as string) || undefined,
        visitorPhone: (formData.get('visitor_phone') as string) || undefined,
        description: (formData.get('description') as string) || undefined,
      })

      setOpen(false)
      e.currentTarget.reset()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la visita')
    } finally {
      setLoading(false)
    }
  }

  const hasOneHouse = houses.length === 1
  const selectedHouse = houses.find(h => h.id === selectedHouseId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button 
        onClick={() => setOpen(true)} 
        style={{
          backgroundColor: "#2563eb",
          color: "white",
          padding: "10px 16px",
          borderRadius: "8px",
          border: "none"
        }}
      >
        <Plus className="h-4 w-4 mr-2" />
        Nueva Visita
      </Button>

      <DialogContent 
        className="max-w-md max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: dialogBgColor,
          color: dialogTextColor,
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.1)"
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: dialogTextColor }}>Registrar Nueva Visita</DialogTitle>
          <DialogDescription style={{ color: dialogTextColor, opacity: 0.7 }}>
            Agrega un registro de quién visitará tu propiedad
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div 
              className="px-3 py-2 rounded-md text-sm border"
              style={{
                backgroundColor: "#7f1d1d",
                borderColor: "#991b1b",
                color: "#f1f5f9"
              }}
            >
              {error}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="house_id" style={{ color: dialogTextColor }}>Casa *</Label>
              {hasOneHouse ? <Lock className="h-3 w-3" style={{ color: dialogTextColor, opacity: 0.5 }} aria-label="Solo lectura" /> : null}
            </div>
            {hasOneHouse ? (
              <div 
                className="px-3 py-2 rounded-md border text-sm"
                style={{
                  backgroundColor: inputBgColor,
                  color: dialogTextColor,
                  borderColor: "rgba(255,255,255,0.2)"
                }}
              >
                Casa #{selectedHouse?.house_number}
              </div>
            ) : (
              <Select value={selectedHouseId} onValueChange={setSelectedHouseId} required>
                <SelectTrigger style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: "rgba(255,255,255,0.2)", borderRadius: "8px" }}>
                  <SelectValue placeholder="Selecciona tu casa" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor }}>
                  {houses.map((house) => (
                    <SelectItem key={house.id} value={house.id}>
                      Casa #{house.house_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="visitor_name" style={{ color: dialogTextColor }}>Nombre del Visitante *</Label>
            <Input
              id="visitor_name"
              name="visitor_name"
              placeholder="Ej: Carlos"
              required
              style={{
                backgroundColor: inputBgColor,
                color: inputTextColor,
                borderColor: "rgba(255,255,255,0.2)",
                borderRadius: "8px"
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visit_title" style={{ color: dialogTextColor }}>Tipo de Visita *</Label>
            <Select name="visit_title" required>
              <SelectTrigger style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: "rgba(255,255,255,0.2)", borderRadius: "8px" }}>
                <SelectValue placeholder="Selecciona tipo" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor }}>
                <SelectItem value="visita">Visita</SelectItem>
                <SelectItem value="cumpleaños">Cumpleaños</SelectItem>
                <SelectItem value="día de la madre">Día de la Madre</SelectItem>
                <SelectItem value="día del padre">Día del Padre</SelectItem>
                <SelectItem value="piscina">Piscina</SelectItem>
                <SelectItem value="reunión">Reunión</SelectItem>
                <SelectItem value="evento">Evento</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visit_date" style={{ color: dialogTextColor }}>Fecha *</Label>
              <Input
                id="visit_date"
                name="visit_date"
                type="date"
                required
                style={{
                  backgroundColor: inputBgColor,
                  color: inputTextColor,
                  borderColor: "rgba(255,255,255,0.2)",
                  borderRadius: "8px"
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visit_time" style={{ color: dialogTextColor }}>Hora</Label>
              <Input
                id="visit_time"
                name="visit_time"
                type="time"
                style={{
                  backgroundColor: inputBgColor,
                  color: inputTextColor,
                  borderColor: "rgba(255,255,255,0.2)",
                  borderRadius: "8px"
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visitor_email" style={{ color: dialogTextColor }}>Email</Label>
            <Input
              id="visitor_email"
              name="visitor_email"
              type="email"
              placeholder="correo@ejemplo.com"
              style={{
                backgroundColor: inputBgColor,
                color: inputTextColor,
                borderColor: "rgba(255,255,255,0.2)",
                borderRadius: "8px"
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visitor_phone" style={{ color: dialogTextColor }}>Teléfono</Label>
            <Input
              id="visitor_phone"
              name="visitor_phone"
              placeholder="+56 9 1234 5678"
              style={{
                backgroundColor: inputBgColor,
                color: inputTextColor,
                borderColor: "rgba(255,255,255,0.2)",
                borderRadius: "8px"
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" style={{ color: dialogTextColor }}>Descripción</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Detalles adicionales..."
              rows={3}
              style={{
                backgroundColor: inputBgColor,
                color: inputTextColor,
                borderColor: "rgba(255,255,255,0.2)",
                borderRadius: "8px"
              }}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: "#2563eb",
                color: "white",
                flex: 1,
                padding: "10px 16px",
                borderRadius: "8px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrar Visita'
              )}
            </Button>
            <Button
              type="button"
              onClick={() => setOpen(false)}
              disabled={loading}
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                color: dialogTextColor,
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.2)",
                cursor: "pointer"
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedHouseId, setSelectedHouseId] = useState(houseId || '')
  const router = useRouter()

  // If owner has only one house, pre-select it
  useEffect(() => {
    if (houses.length === 1) {
      setSelectedHouseId(houses[0].id)
    } else if (houseId) {
      setSelectedHouseId(houseId)
    }
  }, [houses, houseId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      await createVisit({
        houseId: selectedHouseId || (formData.get('house_id') as string),
        visitorName: formData.get('visitor_name') as string,
        visitTitle: formData.get('visit_title') as string,
        visitDate: formData.get('visit_date') as string,
        visitTime: (formData.get('visit_time') as string) || undefined,
        visitorEmail: (formData.get('visitor_email') as string) || undefined,
        visitorPhone: (formData.get('visitor_phone') as string) || undefined,
        description: (formData.get('description') as string) || undefined,
      })

      setOpen(false)
      e.currentTarget.reset()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la visita')
    } finally {
      setLoading(false)
    }
  }

  const hasOneHouse = houses.length === 1
  const selectedHouse = houses.find(h => h.id === selectedHouseId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Nueva Visita
      </Button>

      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nueva Visita</DialogTitle>
          <DialogDescription>Agrega un registro de quién visitará tu propiedad</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="house_id">Casa *</Label>
              {hasOneHouse ? <Lock className="h-3 w-3 text-muted-foreground" aria-label="Solo lectura" /> : null}
            </div>
            {hasOneHouse ? (
              <div className="px-3 py-2 rounded-md border bg-muted text-sm text-muted-foreground">
                Casa #{selectedHouse?.house_number}
              </div>
            ) : (
              <Select value={selectedHouseId} onValueChange={setSelectedHouseId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu casa" />
                </SelectTrigger>
                <SelectContent>
                  {houses.map((house) => (
                    <SelectItem key={house.id} value={house.id}>
                      Casa #{house.house_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="visitor_name">Nombre del Visitante *</Label>
            <Input
              id="visitor_name"
              name="visitor_name"
              placeholder="Ej: Carlos"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visit_title">Tipo de Visita *</Label>
            <Select name="visit_title" required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visita">Visita</SelectItem>
                <SelectItem value="cumpleaños">Cumpleaños</SelectItem>
                <SelectItem value="día de la madre">Día de la Madre</SelectItem>
                <SelectItem value="día del padre">Día del Padre</SelectItem>
                <SelectItem value="piscina">Piscina</SelectItem>
                <SelectItem value="reunión">Reunión</SelectItem>
                <SelectItem value="evento">Evento</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visit_date">Fecha *</Label>
              <Input
                id="visit_date"
                name="visit_date"
                type="date"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visit_time">Hora</Label>
              <Input
                id="visit_time"
                name="visit_time"
                type="time"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visitor_email">Email</Label>
            <Input
              id="visitor_email"
              name="visitor_email"
              type="email"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visitor_phone">Teléfono</Label>
            <Input
              id="visitor_phone"
              name="visitor_phone"
              placeholder="+56 9 1234 5678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Detalles adicionales..."
              className="min-h-[100px]"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Registrar Visita
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
