import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, DollarSign } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default async function IngresoMultasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; año?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id, role")
    .eq("id", user?.id)
    .single()

  const condoId = profile?.condo_id
  const isAdmin = profile?.role === "admin"

  // Get period from query params or use current month
  const params = await searchParams
  const now = new Date()
  const year = parseInt(params.año as string) || now.getFullYear()
  const month = parseInt(params.mes as string) || now.getMonth() + 1

  // Get income records of type "multa"
  let finesIncome: any[] = []

  if (condoId) {
    const { data } = await supabase
      .from("condo_income")
      .select(`
        *,
        houses (house_number, owner_name)
      `)
      .eq("condo_id", condoId)
      .eq("income_type", "multa")
      .eq("period_year", year)
      .eq("period_month", month)
      .order("income_date", { ascending: false })
    
    finesIncome = data || []
  }

  // Calculate totals
  const totalFinesIncome = finesIncome.reduce((sum, inc) => sum + (inc.amount || 0), 0)

  // Navigation
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const canGoNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)

  const monthName = new Date(year, month - 1).toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-7 w-7 text-red-600" />
            Ingresos por Multas
          </h1>
          <p className="text-muted-foreground">Registro de pagos de multas recibidos</p>
        </div>
        
        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-muted/50 rounded-full px-2 py-1">
          <Link href={`/dashboard/ingresos-multas?mes=${prevMonth}&año=${prevYear}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <span className="px-3 py-1 text-sm font-medium min-w-[100px] text-center capitalize">
            {monthName}
          </span>
          {canGoNext ? (
            <Link href={`/dashboard/ingresos-multas?mes=${nextMonth}&año=${nextYear}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Summary Card */}
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-red-600" />
            Total Recaudado por Multas
          </CardTitle>
          <CardDescription>Ingresos registrados en {monthName}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-red-600">
            ${totalFinesIncome.toLocaleString("es-CL")}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {finesIncome.length} pago{finesIncome.length !== 1 ? "s" : ""} registrado{finesIncome.length !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Pagos de Multas</CardTitle>
        </CardHeader>
        <CardContent>
          {finesIncome.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No hay pagos de multas registrados para este mes</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Casa</TableHead>
                  <TableHead>Propietario</TableHead>
                  <TableHead>Descripcion</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finesIncome.map((inc) => (
                  <TableRow key={inc.id}>
                    <TableCell>
                      {new Date(inc.income_date).toLocaleDateString("es-CL")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">#{inc.houses?.house_number}</Badge>
                    </TableCell>
                    <TableCell>{inc.houses?.owner_name || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {inc.description || "Pago de multa"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      ${(inc.amount || 0).toLocaleString("es-CL")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
