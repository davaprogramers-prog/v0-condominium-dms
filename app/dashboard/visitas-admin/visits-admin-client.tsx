'use client'

import { useState, useMemo } from 'react'
import { useTheme } from '@/app/dashboard/theme-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, MapPin, User, Mail, Phone } from 'lucide-react'

interface Visit {
  id: string
  visitor_name: string
  visit_title: string
  visit_date: string
  visit_time?: string
  visitor_email?: string
  visitor_phone?: string
  description?: string
  house: { id: string; house_number: number }
  status: string
}

interface House {
  id: string
  house_number: number
}

interface VisitsAdminClientProps {
  visits: Visit[]
  houses: House[]
  userRole: string
  condoId: string
  userId: string
}

export function VisitsAdminClient({
  visits,
  houses,
  userRole,
  condoId,
  userId,
}: VisitsAdminClientProps) {
  const { cardBgColor, cardTextColor, borderColor } = useTheme()
  const [selectedHouse, setSelectedHouse] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [searchName, setSearchName] = useState<string>('')

  // Filter visits based on criteria
  const filteredVisits = useMemo(() => {
    return visits.filter((visit) => {
      // Filter by house
      if (selectedHouse && visit.house.id !== selectedHouse) {
        return false
      }

      // Filter by date range
      if (startDate && visit.visit_date < startDate) {
        return false
      }
      if (endDate && visit.visit_date > endDate) {
        return false
      }

      // Filter by visitor name
      if (searchName && !visit.visitor_name.toLowerCase().includes(searchName.toLowerCase())) {
        return false
      }

      return true
    })
  }, [visits, selectedHouse, startDate, endDate, searchName])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Programada'
      case 'completed':
        return 'Completada'
      case 'cancelled':
        return 'Cancelada'
      default:
        return status
    }
  }

  // Group visits by house
  const visitsByHouse = useMemo(() => {
    const grouped = new Map<number, Visit[]>()
    filteredVisits.forEach((visit) => {
      const houseNumber = visit.house.house_number
      if (!grouped.has(houseNumber)) {
        grouped.set(houseNumber, [])
      }
      grouped.get(houseNumber)!.push(visit)
    })
    return grouped
  }, [filteredVisits])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 sticky top-0 z-10 p-4">
        <h1 className="text-2xl font-bold mb-4">Gestión de Visitas</h1>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="text-sm font-medium">Buscar por Visitante</label>
            <Input
              placeholder="Nombre del visitante"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              style={{ backgroundColor: cardBgColor, color: cardTextColor, borderColor: borderColor }}
            />
          </div>

          {houses.length > 0 && (
            <div>
              <label className="text-sm font-medium">Propiedad</label>
              <Select value={selectedHouse} onValueChange={setSelectedHouse}>
                <SelectTrigger style={{ backgroundColor: cardBgColor, color: cardTextColor, borderColor: borderColor }}>
                  <SelectValue placeholder="Todas las propiedades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las propiedades</SelectItem>
                  {houses.map((house) => (
                    <SelectItem key={house.id} value={house.id}>
                      Casa #{house.house_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Desde</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ backgroundColor: cardBgColor, color: cardTextColor, borderColor: borderColor }}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Hasta</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ backgroundColor: cardBgColor, color: cardTextColor, borderColor: borderColor }}
            />
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedHouse('')
                setStartDate('')
                setEndDate('')
                setSearchName('')
              }}
              className="w-full"
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-6xl mx-auto">
          {filteredVisits.length === 0 ? (
            <Card style={{ backgroundColor: cardBgColor, borderColor: borderColor, color: cardTextColor }}>
              <CardContent className="text-center py-12">
                <p style={{ opacity: 0.7 }}>No hay visitas que coincidan con los filtros seleccionados</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {Array.from(visitsByHouse.entries()).map(([houseNumber, houseVisits]) => (
                <div key={houseNumber} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <h2 className="text-lg font-bold">Casa #{houseNumber}</h2>
                    <Badge>{houseVisits.length} visita(s)</Badge>
                  </div>

                  <div className="grid gap-3">
                    {houseVisits.map((visit) => (
                      <Card
                        key={visit.id}
                        style={{ backgroundColor: cardBgColor, borderColor: borderColor, color: cardTextColor }}
                        className="overflow-hidden"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg" style={{ color: cardTextColor }}>
                                {visit.visitor_name}
                              </CardTitle>
                              <p className="text-sm" style={{ color: cardTextColor, opacity: 0.7 }}>
                                {visit.visit_title}
                              </p>
                            </div>
                            <Badge className={getStatusColor(visit.status)}>
                              {getStatusLabel(visit.status)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2" style={{ color: cardTextColor, opacity: 0.7 }}>
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(visit.visit_date).toLocaleDateString('es-CL')}
                                {visit.visit_time && ` a las ${visit.visit_time.substring(0, 5)}`}
                              </span>
                            </div>

                            {visit.visitor_email && (
                              <div className="flex items-center gap-2" style={{ color: cardTextColor, opacity: 0.7 }}>
                                <Mail className="h-4 w-4" />
                                <span>{visit.visitor_email}</span>
                              </div>
                            )}

                            {visit.visitor_phone && (
                              <div className="flex items-center gap-2" style={{ color: cardTextColor, opacity: 0.7 }}>
                                <Phone className="h-4 w-4" />
                                <span>{visit.visitor_phone}</span>
                              </div>
                            )}

                            {visit.description && (
                              <div className="col-span-full" style={{ color: cardTextColor, opacity: 0.7 }}>
                                <p className="text-xs font-medium mb-1">Descripción:</p>
                                <p>{visit.description}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
