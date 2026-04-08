import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FileCheck, Download, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function CartolasPage() {
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

  // Get cartolas (account statements) for this house/owner
  const { data: cartolas } = await supabase
    .from("condo_income")
    .select("*")
    .eq("house_id", profile?.house_id)
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false })
    .limit(12)

  // Get condo info
  const { data: condo } = await supabase
    .from("condominiums")
    .select("currency_symbol")
    .eq("id", profile?.condo_id)
    .single()

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  // Group by period
  const cartolesByPeriod = (cartolas || []).reduce((acc: any, cart: any) => {
    const key = `${cart.period_year}-${String(cart.period_month).padStart(2, '0')}`
    if (!acc[key]) {
      acc[key] = {
        period: key,
        year: cart.period_year,
        month: cart.period_month,
        total: 0,
        items: []
      }
    }
    acc[key].total += cart.amount || 0
    acc[key].items.push(cart)
    return acc
  }, {})

  const cartolesList = Object.values(cartolesByPeriod)
    .sort((a: any, b: any) => `${b.year}-${String(b.month).padStart(2, '0')}`.localeCompare(`${a.year}-${String(a.month).padStart(2, '0')}`))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileCheck className="h-8 w-8" />
          Cartolas
        </h1>
        <p className="text-muted-foreground">Tus cartolas y estados de cuenta mensuales</p>
      </div>

      {cartolesList.length > 0 ? (
        <div className="space-y-4">
          {cartolesList.map((cartola: any) => (
            <Card key={cartola.period} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">
                        {monthNames[cartola.month - 1]} {cartola.year}
                      </CardTitle>
                      <CardDescription>{cartola.items.length} concepto(s)</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {condo?.currency_symbol}{cartola.total.toLocaleString("es-CL")}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {cartola.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm py-2 border-t">
                      <span className="text-muted-foreground">{item.description || "Gasto Común"}</span>
                      <span className="font-medium">{condo?.currency_symbol}{item.amount?.toLocaleString("es-CL")}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Cartola
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <FileCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No hay cartolas disponibles</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
