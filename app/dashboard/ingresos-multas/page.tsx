import { createClient } from "@/lib/supabase/server"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { resolvePeriod } from "@/lib/period"
import { PeriodAnchor } from "@/components/period-anchor"
import { IngresoMultasClient } from "./ingresos-multas-client"

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

  // Get all houses for the dropdown
  let houses: any[] = []
  if (condoId) {
    const { data } = await supabase
      .from("houses")
      .select("id, house_number, owner_name")
      .eq("condo_id", condoId)
      .order("house_number", { ascending: true })
    houses = data || []
  }

  // Get currency info
  const { data: condo } = await supabase
    .from("condominiums")
    .select("currency_symbol")
    .eq("id", condoId)
    .single()
  const currencySymbol = condo?.currency_symbol || "$"

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

      <IngresoMultasClient
        finesData={finesData}
        incomeRecords={incomeRecords}
        houses={houses}
        totalFines={totalFines}
        paidCount={paidCount}
        combinedTotal={combinedTotal}
        month={month}
        year={year}
        isAdmin={isAdmin}
        currencySymbol={currencySymbol}
      />
    </div>
  )
}
