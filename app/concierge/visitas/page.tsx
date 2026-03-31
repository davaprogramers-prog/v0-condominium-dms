import { Metadata } from 'next'
import { ChevronLeft, Calendar, MapPin, User, Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCondoVisitsForConcierge } from '../actions'

export const metadata: Metadata = {
  title: 'Visitas Programadas | Conserje | Condominio',
  description: 'Vista detallada de visitas programadas',
}

export default async function ConciergeVisitasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('condo_id, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'conserje') redirect('/dashboard')

  const visits = await getCondoVisitsForConcierge()

  // Group visits by date
  const visitsByDate = visits.reduce((acc: Record<string, any[]>, visit: any) => {
    const date = visit.visit_date
    if (!acc[date]) acc[date] = []
    acc[date].push(visit)
    return acc
  }, {})

  const sortedDates = Object.keys(visitsByDate).sort()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background/95 sticky top-0 z-10">
        <div className="flex items-center gap-3 h-16 px-4">
          <Link href="/concierge/dashboard" className="md:hidden">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold">Visitas Programadas</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-4">
          {visits.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay visitas programadas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((date) => (
                <div key={date}>
                  <h2 className="text-lg font-semibold mb-3">
                    {new Date(date).toLocaleDateString('es-CL', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h2>
                  <div className="space-y-3">
                    {visitsByDate[date].map((visit: any) => (
                      <Card key={visit.id}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-base">{visit.visitor_name}</CardTitle>
                              <p className="text-sm text-muted-foreground">{visit.visit_title}</p>
                            </div>
                            {visit.visit_time && (
                              <Badge variant="outline">{visit.visit_time.substring(0, 5)}</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>Casa #{visit.house?.house_number}</span>
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
