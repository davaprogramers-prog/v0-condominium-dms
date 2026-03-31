import { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAdminVisits } from './actions'

export const metadata: Metadata = {
  title: 'Visitas | Admin | Condominio',
  description: 'Gestión de visitas del condominio',
}

export default async function AdminVisitasPage() {
  const visits = await getAdminVisits()

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 sticky top-0 z-10">
        <div className="flex items-center gap-3 h-16 px-4">
          <Link href="/dashboard" className="md:hidden">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold">Gestión de Visitas</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-4">
          <div className="space-y-4">
            {visits.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No hay visitas registradas</p>
                </CardContent>
              </Card>
            ) : (
              visits.map((visit) => (
                <Card key={visit.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{visit.visitor_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Casa #{visit.house?.house_number} • {visit.created_by_profile?.name}
                        </p>
                      </div>
                      <Badge className={getStatusColor(visit.status)}>
                        {visit.status === 'scheduled' && 'Programada'}
                        {visit.status === 'completed' && 'Completada'}
                        {visit.status === 'cancelled' && 'Cancelada'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground">Tipo de Visita</p>
                        <p>{visit.visit_title}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Fecha y Hora</p>
                        <p>
                          {new Date(visit.visit_date).toLocaleDateString('es-CL')}
                          {visit.visit_time && ` a las ${visit.visit_time.substring(0, 5)}`}
                        </p>
                      </div>
                      {visit.visitor_email && (
                        <div>
                          <p className="font-medium text-muted-foreground">Email</p>
                          <p>{visit.visitor_email}</p>
                        </div>
                      )}
                      {visit.visitor_phone && (
                        <div>
                          <p className="font-medium text-muted-foreground">Teléfono</p>
                          <p>{visit.visitor_phone}</p>
                        </div>
                      )}
                    </div>
                    {visit.description && (
                      <div className="mt-4">
                        <p className="font-medium text-muted-foreground text-sm">Descripción</p>
                        <p className="text-sm">{visit.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
