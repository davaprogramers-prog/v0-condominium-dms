import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MapPin, Trees, Wifi, Dumbbell, Utensils, BookOpen } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AreasComunesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id, role, house_id")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"
  if (!profile?.house_id && !isAdmin) {
    redirect("/dashboard/mi-casa")
  }

  // Get condo and common areas
  const { data: condo } = await supabase
    .from("condominiums")
    .select("*")
    .eq("id", profile?.condo_id)
    .single()

  const { data: commonAreas } = await supabase
    .from("common_areas")
    .select("*")
    .eq("condo_id", profile?.condo_id)
    .order("name")

  const areaIcons: { [key: string]: any } = {
    "piscina": Wifi,
    "gimnasio": Dumbbell,
    "cancha": MapPin,
    "jardin": Trees,
    "comedor": Utensils,
    "biblioteca": BookOpen,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MapPin className="h-8 w-8" />
          Áreas Comunes
        </h1>
        <p className="text-muted-foreground">Información sobre las áreas comunes del condominio</p>
      </div>

      {commonAreas && commonAreas.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {commonAreas.map((area) => {
            const IconComponent = areaIcons[area.type?.toLowerCase()] || MapPin
            return (
              <Card key={area.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{area.name}</CardTitle>
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  {area.type && (
                    <CardDescription className="capitalize">{area.type}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {area.description && (
                    <div>
                      <p className="text-sm text-muted-foreground">{area.description}</p>
                    </div>
                  )}
                  {area.capacity && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Capacidad: <span className="font-semibold">{area.capacity} personas</span></p>
                    </div>
                  )}
                  {area.reservation_required !== undefined && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">
                        Requiere reservación: <span className="font-semibold">{area.reservation_required ? "Sí" : "No"}</span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No hay áreas comunes registradas en el condominio</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
