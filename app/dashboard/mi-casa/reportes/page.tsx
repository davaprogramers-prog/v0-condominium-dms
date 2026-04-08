import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserCondoId, getUserHouseId } from "@/lib/supabase/owner-utils"
import { BarChart3, TrendingUp, Home, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function ReportesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Get condo and house using utility functions to avoid RLS issues
  const condoId = await getUserCondoId(supabase, user.id)
  const houseId = await getUserHouseId(supabase, user.id)

  if (!houseId || !condoId) redirect("/dashboard/mi-casa")

  // Get user profile for name display
  let profile: any = null
  try {
    const { data: profileData, error: pError } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .limit(1)
      .single()

    if (profileData && !pError) {
      profile = profileData
    }
  } catch (e) {
    console.log("[v0] Could not fetch profile in reportes")
  }

  // Get house details
  const { data: house } = await supabase
    .from("houses")
    .select("*")
    .eq("id", houseId)
    .single()

  // Get all incomes for this year
  const { data: allIncomes } = await supabase
    .from("condo_income")
    .select("*")
    .eq("house_id", houseId)
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false })

  // Get payment proofs
  const { data: paymentProofs } = await supabase
    .from("payment_proofs")
    .select("*")
    .eq("house_id", houseId)

  // Get condo info
  const { data: condo } = await supabase
    .from("condominiums")
    .select("currency_symbol, name")
    .eq("id", condoId)
    .single()

  // Helper to check approved proofs
  const hasApprovedProof = (incomeId: string, incomeType: string) => {
    return paymentProofs?.some(p => {
      if (incomeType === 'fixed') {
        return p.fixed_income_id === incomeId && p.status === 'approved'
      } else {
        return p.variable_income_id === incomeId && p.status === 'approved'
      }
    }) || false
  }

  // Group incomes by period (year-month)
  const groupedByPeriod = (allIncomes || []).reduce((acc: any, income: any) => {
    const key = `${income.period_year}-${String(income.period_month).padStart(2, '0')}`
    if (!acc[key]) {
      acc[key] = {
        year: income.period_year,
        month: income.period_month,
        total: 0,
        paid: 0,
        count: 0,
        incomes: []
      }
    }
    acc[key].total += income.amount || 0
    acc[key].count += 1
    acc[key].incomes.push(income)
    if (hasApprovedProof(income.id, income.income_type)) {
      acc[key].paid += income.amount || 0
    }
    return acc
  }, {})

  const periodsList = Object.entries(groupedByPeriod)
    .sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
    .map(([key, data]) => ({ key, ...data as any }))

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Reportes
        </h1>
        <p className="text-muted-foreground">Resumen de gastos y pagos de tu propiedad</p>
      </div>

      {/* House Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Casa #{house?.house_number}
          </CardTitle>
          <CardDescription>{condo?.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Propietario</p>
              <p className="font-semibold">{profile?.first_name} {profile?.last_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <p className="font-semibold">Activa</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Acumulado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {condo?.currency_symbol}{(allIncomes?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0).toLocaleString("es-CL")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{allIncomes?.length || 0} registros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Pagado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {condo?.currency_symbol}{(allIncomes?.filter(i => hasApprovedProof(i.id, i.income_type)).reduce((sum, i) => sum + (i.amount || 0), 0) || 0).toLocaleString("es-CL")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Aprobado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Por Cobrar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {condo?.currency_symbol}{((allIncomes?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0) - (allIncomes?.filter(i => hasApprovedProof(i.id, i.income_type)).reduce((sum, i) => sum + (i.amount || 0), 0) || 0)).toLocaleString("es-CL")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pendiente</p>
          </CardContent>
        </Card>
      </div>

      {/* Period History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial por Período</CardTitle>
          <CardDescription>Gastos mensuales y estado de pagos</CardDescription>
        </CardHeader>
        <CardContent>
          {periodsList.length > 0 ? (
            <div className="space-y-3">
              {periodsList.map((period) => (
                <div key={period.key} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                  <div>
                    <p className="font-semibold">
                      {monthNames[period.month - 1]} {period.year}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {period.count} gasto{period.count !== 1 ? "s" : ""} - {period.paid > 0 ? "Parcialmente pagado" : "Pendiente"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-bold">{condo?.currency_symbol}{period.total.toLocaleString("es-CL")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Pagado</p>
                      <p className={`font-bold ${period.paid > 0 ? "text-green-600" : "text-gray-400"}`}>
                        {condo?.currency_symbol}{period.paid.toLocaleString("es-CL")}
                      </p>
                    </div>
                    <Link href={`/dashboard/mi-casa/balance?mes=${period.month}&año=${period.year}`}>
                      <Button variant="outline" size="sm">Ver</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>No hay datos disponibles</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

  // Get house details
  const { data: house } = await supabase
    .from("houses")
    .select("*")
    .eq("id", profile.house_id)
    .single()

  // Get all incomes for this year
  const { data: allIncomes } = await supabase
    .from("condo_income")
    .select("*")
    .eq("house_id", profile.house_id)
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false })

  // Get payment proofs
  const { data: paymentProofs } = await supabase
    .from("payment_proofs")
    .select("*")
    .eq("house_id", profile.house_id)

  // Get condo info
  const { data: condo } = await supabase
    .from("condominiums")
    .select("currency_symbol, name")
    .eq("id", profile.condo_id)
    .single()

  // Helper to check approved proofs
  const hasApprovedProof = (incomeId: string, incomeType: string) => {
    return paymentProofs?.some(p => {
      if (incomeType === 'fixed') {
        return p.fixed_income_id === incomeId && p.status === 'approved'
      } else {
        return p.variable_income_id === incomeId && p.status === 'approved'
      }
    }) || false
  }

  // Group incomes by period (year-month)
  const groupedByPeriod = (allIncomes || []).reduce((acc: any, income: any) => {
    const key = `${income.period_year}-${String(income.period_month).padStart(2, '0')}`
    if (!acc[key]) {
      acc[key] = {
        year: income.period_year,
        month: income.period_month,
        total: 0,
        paid: 0,
        count: 0,
        incomes: []
      }
    }
    acc[key].total += income.amount || 0
    acc[key].count += 1
    acc[key].incomes.push(income)
    if (hasApprovedProof(income.id, income.income_type)) {
      acc[key].paid += income.amount || 0
    }
    return acc
  }, {})

  const periodsList = Object.entries(groupedByPeriod)
    .sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
    .map(([key, data]) => ({ key, ...data as any }))

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Reportes
        </h1>
        <p className="text-muted-foreground">Resumen de gastos y pagos de tu propiedad</p>
      </div>

      {/* House Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Casa #{house?.house_number}
          </CardTitle>
          <CardDescription>{condo?.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Propietario</p>
              <p className="font-semibold">{profile?.first_name} {profile?.last_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <p className="font-semibold">Activa</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Acumulado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {condo?.currency_symbol}{(allIncomes?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0).toLocaleString("es-CL")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{allIncomes?.length || 0} registros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Pagado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {condo?.currency_symbol}{(allIncomes?.filter(i => hasApprovedProof(i.id, i.income_type)).reduce((sum, i) => sum + (i.amount || 0), 0) || 0).toLocaleString("es-CL")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Aprobado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Por Cobrar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {condo?.currency_symbol}{((allIncomes?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0) - (allIncomes?.filter(i => hasApprovedProof(i.id, i.income_type)).reduce((sum, i) => sum + (i.amount || 0), 0) || 0)).toLocaleString("es-CL")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pendiente</p>
          </CardContent>
        </Card>
      </div>

      {/* Period History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial por Período</CardTitle>
          <CardDescription>Gastos mensuales y estado de pagos</CardDescription>
        </CardHeader>
        <CardContent>
          {periodsList.length > 0 ? (
            <div className="space-y-3">
              {periodsList.map((period) => (
                <div key={period.key} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                  <div>
                    <p className="font-semibold">
                      {monthNames[period.month - 1]} {period.year}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {period.count} gasto{period.count !== 1 ? "s" : ""} - {period.paid > 0 ? "Parcialmente pagado" : "Pendiente"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-bold">{condo?.currency_symbol}{period.total.toLocaleString("es-CL")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Pagado</p>
                      <p className={`font-bold ${period.paid > 0 ? "text-green-600" : "text-gray-400"}`}>
                        {condo?.currency_symbol}{period.paid.toLocaleString("es-CL")}
                      </p>
                    </div>
                    <Link href={`/dashboard/mi-casa/balance?mes=${period.month}&año=${period.year}`}>
                      <Button variant="outline" size="sm">Ver</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>No hay datos disponibles</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
