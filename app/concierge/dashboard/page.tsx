import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, AlertCircle, ClipboardList } from 'lucide-react'
import { getCondoVisitsForConcierge, getHousesWithPendingVisits, getSupplyRequests } from './actions'

export const metadata: Metadata = {
  title: 'Dashboard Conserje | Condominio',
  description: 'Portal de conserje para gestionar visitas y solicitudes',
}

export default async function ConciergeDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('condo_id, role, name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'conserje') redirect('/dashboard')

  try {
    const [visits, houses, requests] = await Promise.all([
      getCondoVisitsForConcierge(),
      getHousesWithPendingVisits(),
      getSupplyRequests(),
    ])

    const todayVisits = visits.filter(v => v.visit_date === new Date().toISOString().split('T')[0])
    const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'approved')

    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Dashboard Conserje</h1>
            <p className="text-muted-foreground">Bienvenido, {profile?.name}</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visitas Hoy</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayVisits.length}</div>
                <p className="text-xs text-muted-foreground">visitas programadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Próximas Visitas</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{visits.length}</div>
                <p className="text-xs text-muted-foreground">en los próximos días</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingRequests.length}</div>
                <p className="text-xs text-muted-foreground">de materiales</p>
              </CardContent>
            </Card>
          </div>

          {/* Visitas de Hoy */}
          <Card>
            <CardHeader>
              <CardTitle>Visitas de Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              {todayVisits.length === 0 ? (
                <p className="text-muted-foreground">No hay visitas programadas para hoy</p>
              ) : (
                <div className="space-y-4">
                  {todayVisits.map((visit) => (
                    <div key={visit.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{visit.visitor_name}</h3>
                          <p className="text-sm text-muted-foreground">{visit.visit_title}</p>
                          <p className="text-sm">Casa #{visit.house?.house_number}</p>
                        </div>
                        <Badge>{visit.visit_time || 'Sin hora'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Casas con Visitas */}
          <Card>
            <CardHeader>
              <CardTitle>Casas con Visitas Programadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {houses.filter(h => h.pending_visits > 0).length === 0 ? (
                  <p className="text-muted-foreground">No hay casas con visitas programadas</p>
                ) : (
                  houses
                    .filter(h => h.pending_visits > 0)
                    .map((house: any) => (
                      <Card key={house.id} className="border">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">Casa #{house.house_number}</CardTitle>
                              <p className="text-sm text-muted-foreground">{house.profiles?.name}</p>
                            </div>
                            <Badge variant="outline">{house.pending_visits} visita{house.pending_visits > 1 ? 's' : ''}</Badge>
                          </div>
                        </CardHeader>
                      </Card>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  } catch (error) {
    console.error('[v0] Error loading concierge dashboard:', error)
    return <div>Error cargando el dashboard</div>
  }
}
