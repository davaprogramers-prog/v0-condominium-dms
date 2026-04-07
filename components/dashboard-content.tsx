"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Receipt, DollarSign, Home, Vote, AlertTriangle, TrendingUp, CheckCircle2, Clock, Hammer } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface DashboardContentProps {
  expenses: Record<string, unknown>[]
  payments: Record<string, unknown>[]
  houses: Record<string, unknown>[]
  activeSurveys: number
  pendingInfractions: number
  variableIncome: Record<string, unknown>[]
  condo: Record<string, unknown> | null
  totalExpenses: number
  totalPayments: number
  totalVariableIncome: number
  pendingPayments: number
  approvedPayments: number
  projects: Record<string, unknown>[]
  pendingProjects: number
  completedProjects: number
  profile: Record<string, unknown>
}

export function DashboardContent({
  expenses,
  payments,
  houses,
  activeSurveys,
  pendingInfractions,
  variableIncome,
  condo,
  totalExpenses,
  totalPayments,
  totalVariableIncome,
  pendingPayments,
  approvedPayments,
  projects,
  pendingProjects,
  completedProjects,
  profile,
}: DashboardContentProps) {
  const currencySymbol = (condo?.currency_symbol as string) || "$"
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"
  const balance = totalPayments + totalVariableIncome - totalExpenses

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-balance">
          {"Bienvenido, "}
          {(profile?.first_name as string) || "Usuario"}
        </h1>
        <p className="text-muted-foreground">
          {isAdmin 
            ? `${condo?.name} - Panel de administración` 
            : "Resumen de tu condominio"}
        </p>
      </div>

      {/* Alertas Críticas */}
      <div className="flex flex-col gap-2">
        {pendingInfractions > 0 && isAdmin && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {`${pendingInfractions} infracciones pendientes de pago`}
                </span>
              </div>
              <Link href="/dashboard/infracciones">
                <Button variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-100">
                  Ver
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
        {pendingPayments > 0 && isAdmin && (
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {`${pendingPayments} comprobantes pendientes de revisión`}
                </span>
              </div>
              <Link href="/dashboard/ingresos">
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-100">
                  Revisar
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Ingresos */}
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
              <DollarSign className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ingresos Verificados</p>
              <p className="text-xl font-bold">{currencySymbol}{(totalPayments || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{approvedPayments} pagos</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Gastos */}
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
              <Receipt className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Gastos</p>
              <p className="text-xl font-bold">{currencySymbol}{(totalExpenses || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{expenses.length} registros</p>
            </div>
          </CardContent>
        </Card>

        {/* Balance */}
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${balance >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <TrendingUp className={`h-6 w-6 ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className={`text-xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currencySymbol}{balance.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">{totalVariableIncome > 0 ? '+Ingresos variable' : ''}</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Casas */}
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
              <Home className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Casas</p>
              <p className="text-xl font-bold">{houses.length}</p>
              <p className="text-xs text-muted-foreground">del condominio</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sección de Estadísticas Secundarias para Admin */}
      {isAdmin && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Encuestas */}
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                <Vote className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Encuestas Activas</p>
                <p className="text-2xl font-bold">{activeSurveys}</p>
              </div>
            </CardContent>
          </Card>

          {/* Proyectos */}
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                <Hammer className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Proyectos</p>
                <p className="text-2xl font-bold">{pendingProjects + completedProjects}</p>
                <p className="text-xs text-muted-foreground">{completedProjects} completados</p>
              </div>
            </CardContent>
          </Card>

          {/* Infracciones */}
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Infracciones Pendientes</p>
                <p className="text-2xl font-bold">{pendingInfractions}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sección de Listados */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gastos Recientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">Gastos Recientes</CardTitle>
              <CardDescription>Últimos gastos registrados</CardDescription>
            </div>
            {isAdmin && (
              <Link href="/dashboard/gastos">
                <Button variant="ghost" size="sm">Ver todo</Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No hay gastos registrados</p>
            ) : (
              <div className="flex flex-col gap-3">
                {expenses.slice(0, 5).map((expense) => (
                  <div key={expense.id as string} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{expense.description as string}</p>
                      <p className="text-xs text-muted-foreground">{(expense.expense_date as string)?.substring(0, 10)}</p>
                    </div>
                    <span className="text-sm font-semibold text-red-600">
                      -{currencySymbol}{Number(expense.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagos Recientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">Pagos Recientes</CardTitle>
              <CardDescription>Últimos comprobantes recibidos</CardDescription>
            </div>
            {isAdmin && (
              <Link href="/dashboard/ingresos">
                <Button variant="ghost" size="sm">Ver todo</Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No hay pagos registrados</p>
            ) : (
              <div className="flex flex-col gap-3">
                {payments.slice(0, 5).map((payment) => (
                  <div key={payment.id as string} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Casa {(payment.houses as Record<string, unknown>)?.house_number as string || "?"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Período: {payment.period_month as string}/{payment.period_year as string}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-emerald-600">
                        +{currencySymbol}{Number(payment.amount).toLocaleString()}
                      </span>
                      <Badge
                        variant={
                          payment.status === "verificado"
                            ? "default"
                            : payment.status === "rechazado"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {payment.status === "verificado" ? "✓" : payment.status === "pendiente" ? "⏳" : "✗"} {payment.status as string}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sección de Ingresos Variable para Admin */}
      {isAdmin && variableIncome.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">Ingresos Variable</CardTitle>
              <CardDescription>Ingresos adicionales del condominio</CardDescription>
            </div>
            <Link href="/dashboard/ingreso-variable">
              <Button variant="ghost" size="sm">Ver todo</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {variableIncome.slice(0, 5).map((income) => (
                <div key={income.id as string} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{income.description as string}</p>
                    <p className="text-xs text-muted-foreground">{(income.date as string)?.substring(0, 10)}</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">
                    +{currencySymbol}{Number(income.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
