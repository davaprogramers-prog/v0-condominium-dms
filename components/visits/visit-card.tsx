'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, MapPin, User, Mail, Phone } from 'lucide-react'

interface VisitCardProps {
  visit: {
    id: string
    visitor_name: string
    visit_title: string
    visit_date: string
    visit_time?: string
    visitor_email?: string
    visitor_phone?: string
    description?: string
    status: 'scheduled' | 'completed' | 'cancelled'
    house?: {
      house_number: string
    }
    created_by_profile?: {
      name: string
    }
  }
}

export function VisitCard({ visit }: VisitCardProps) {
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg">{visit.visitor_name}</CardTitle>
            <p className="text-sm text-muted-foreground">{visit.visit_title}</p>
          </div>
          <Badge className={getStatusColor(visit.status)}>
            {getStatusLabel(visit.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {visit.house && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>Casa #{visit.house.house_number}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {new Date(visit.visit_date).toLocaleDateString('es-CL')}
              {visit.visit_time && ` a las ${visit.visit_time.substring(0, 5)}`}
            </span>
          </div>
          {visit.visitor_email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{visit.visitor_email}</span>
            </div>
          )}
          {visit.visitor_phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{visit.visitor_phone}</span>
            </div>
          )}
          {visit.description && (
            <p className="text-muted-foreground italic">{visit.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
