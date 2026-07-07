import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, DollarSign } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { resolvePeriod } from "@/lib/period"
import { PeriodAnchor } from "@/components/period-anchor"

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
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"

  // Get period from query params, anchored cookie, or fall back to current month
  const params = await searchParams
  const now = new Date()
  const { year, month } = await resolvePeriod(params)

  // Get paid infractions (which are fines income)
  let finesData: any[] = []
  let totalFines = 0
  let paidCount = 0

  if (condoId) {
    // Get paid infractions and calculate totals
    const { data: infractions } = await supabase
      .from("infractions")
      .select(`
        id,
        fine_amount,
        is_paid,
        paid_date,
        description,
        houses (house_number, owner_name)
      `)
      .eq("condo_id", condoId)
      .eq("is_paid", true)
      .order("paid_date", { ascending: false })

    // Filter by month/year if date exists
    if (infractions) {
      finesData = infractions.filter(inf => {
        if (!inf.paid_date) return false
        const paidDate = new Date(inf.paid_date)
        return paidDate.getFullYear() === year && (paidDate.getMonth() + 1) === month
      })

      paidCount = finesData.length
      totalFines = finesData.reduce((sum, inf) => sum + (inf.fine_amount || 0), 0)
    }
  }

  // Also get income records of type "multa" for backward compatibility
  let incomeRecords: any[] = []
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
    
    incomeRecords = data || []
  }

  // Combine both sources
  const allFinesIncome = [...finesData, ...incomeRecords]
  const combinedTotal = totalFines + incomeRecords.reduce((sum, inc) => sum + (inc.amount || 0), 0)

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
      <PeriodAnchor month={month} year={year} />
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
        <p className="text-muted-foreground text-sm">Registro de pagos de multas recibidos</p>
      </div>

      {/* Month Navigation - Centered */}
      <div className="flex items-center justify-center gap-4">
        <Link href={`/dashboard/ingresos-multas?mes=${prevMonth}&año=${prevYear}`}>
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <span className="px-4 py-2 text-lg font-semibold capitalize min-w-[180px] text-center">
          {monthName}
        </span>
        {canGoNext ? (
          <Link href={`/dashboard/ingresos-multas?mes=${nextMonth}&año=${nextYear}`}>
            <Button variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="icon" disabled>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Multas Pagadas</p>
            <p className="text-2xl font-bold text-red-600">${combinedTotal.toLocaleString("es-CL")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Infracciones Pagadas</p>
            <p className="text-2xl font-bold text-emerald-600">{paidCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Ingresos Registrados</p>
            <p className="text-2xl font-bold">{incomeRecords.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Pagos de Multas</CardTitle>
        </CardHeader>
        <CardContent>
          {allFinesIncome.length === 0 ? (
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
                  <TableHead>Residente</TableHead>
                  <TableHead>Descripcion</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allFinesIncome.map((item, idx) => {
                  const date = item.paid_date || item.income_date
                  return (
                    <TableRow key={`${item.id}-${idx}`}>
                      <TableCell>
                        {new Date(date).toLocaleDateString("es-CL")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">#{item.houses?.house_number}</Badge>
                      </TableCell>
                      <TableCell>{item.houses?.owner_name || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.description || "Pago de multa"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-600">
                        ${(item.fine_amount || item.amount || 0).toLocaleString("es-CL")}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
