import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserCondoId, getUserHouseId } from "@/lib/supabase/owner-utils"
import { BarChart3, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ReportesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Obtener condo e id de casa
  const condoId = await getUserCondoId(supabase, user.id)
  const houseId = await getUserHouseId(supabase, user.id)

  if (!houseId || !condoId) redirect("/dashboard/mi-casa")

  // Obtener información de la casa
  const { data: house } = await supabase
    .from("houses")
    .select("*")
    .eq("id", houseId)
    .single()

  // Obtener condominios
  const { data: condo } = await supabase
    .from("condominiums")
    .select("currency_symbol, name")
    .eq("id", condoId)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Reportes
        </h1>
        <p className="text-muted-foreground">Resumen de gastos y pagos de tu propiedad</p>
      </div>

      {/* Información de la Casa */}
      <Card>
        <CardHeader>
          <CardTitle>Casa #{house?.house_number}</CardTitle>
          <CardDescription>{condo?.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Estado: Activa</p>
        </CardContent>
      </Card>

      {/* Próximamente */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>Los reportes estarán disponibles pronto</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
