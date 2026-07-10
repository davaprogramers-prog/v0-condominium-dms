"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DebtPaymentForm } from "./debt-payment-form"

interface DebtItem {
  id: string
  amount: number
  income_type: string
  period_month: number
  period_year: number
  description?: string
}

interface MisDeudasClientProps {
  houseId: string
  houseNumber: string | number
  condoId: string
  currencySymbol: string
  commonExpenses: any[]
  variableExpenses: any[]
  infractions: any[]
  commonExpenseTotal: number
  variableExpenseTotal: number
  finesTotal: number
  totalDebt: number
}

export function MisDeudasClient({
  houseId,
  houseNumber,
  condoId,
  currencySymbol,
  commonExpenses,
  variableExpenses,
  infractions,
  commonExpenseTotal,
  variableExpenseTotal,
  finesTotal,
  totalDebt,
}: MisDeudasClientProps) {
  const [selectedDebts, setSelectedDebts] = useState<DebtItem[]>([])

  // Combine all debts into single array
  const allDebts: DebtItem[] = [
    ...commonExpenses.map((e) => ({
      id: e.id,
      amount: e.amount || 0,
      income_type: e.income_type || "gasto_comun",
      period_month: e.period_month,
      period_year: e.period_year,
      description: e.description,
    })),
    ...variableExpenses.map((e) => ({
      id: e.id,
      amount: e.amount || 0,
      income_type: "variable",
      period_month: e.period_month,
      period_year: e.period_year,
      description: e.description,
    })),
    ...infractions.map((i) => ({
      id: i.id,
      amount: i.amount_pending || 0,
      income_type: "multa",
      period_month: i.period_month || new Date().getMonth() + 1,
      period_year: i.period_year || new Date().getFullYear(),
      description: `Multa: ${i.reason}`,
    })),
  ]

  const handleDebtToggle = (debt: DebtItem) => {
    setSelectedDebts((prev) => {
      const isSelected = prev.find((d) => d.id === debt.id)
      if (isSelected) {
        return prev.filter((d) => d.id !== debt.id)
      } else {
        return [...prev, debt]
      }
    })
  }

  const selectedTotal = selectedDebts.reduce((sum, debt) => sum + debt.amount, 0)
  const hasCommonSelected = selectedDebts.some((d) => d.income_type === "gasto_comun")
  const hasVariableSelected = selectedDebts.some((d) => d.income_type === "variable")
  const hasFinesSelected = selectedDebts.some((d) => d.income_type === "multa")

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Debt Breakdown */}
      <div className="lg:col-span-2 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {commonExpenseTotal > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-amber-900">Gasto Común</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-900">
                  {currencySymbol}
                  {commonExpenseTotal.toLocaleString("es-CL")}
                </p>
              </CardContent>
            </Card>
          )}
          {variableExpenseTotal > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-900">Gasto Variable</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-900">
                  {currencySymbol}
                  {variableExpenseTotal.toLocaleString("es-CL")}
                </p>
              </CardContent>
            </Card>
          )}
          {finesTotal > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-900">Multas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-900">
                  {currencySymbol}
                  {finesTotal.toLocaleString("es-CL")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Total Debt Card */}
        <Card className="border-red-300 bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader>
            <CardTitle className="text-red-900">Total Deuda Pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-red-900">
              {currencySymbol}
              {totalDebt.toLocaleString("es-CL")}
            </p>
          </CardContent>
        </Card>

        {/* Debt Breakdown with Checkboxes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Desglose de Deudas</CardTitle>
                <CardDescription>Selecciona las deudas a pagar</CardDescription>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (selectedDebts.length === allDebts.length) {
                    setSelectedDebts([])
                  } else {
                    setSelectedDebts(allDebts)
                  }
                }}
                className="text-sm font-medium text-primary hover:underline"
              >
                {selectedDebts.length === allDebts.length ? "Desmarcar todo" : "Marcar todo"}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allDebts.map((debt) => {
                const isSelected = selectedDebts.some((d) => d.id === debt.id)
                const typeLabel =
                  debt.income_type === "variable"
                    ? "Gasto Variable"
                    : debt.income_type === "multa"
                      ? "Multa"
                      : "Gasto Común"

                const monthName = new Date(debt.period_year, debt.period_month - 1).toLocaleDateString("es-CL", {
                  month: "long",
                  year: "numeric",
                })

                return (
                  <div
                    key={debt.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition"
                    onClick={() => handleDebtToggle(debt)}
                  >
                    <Checkbox checked={isSelected} onChange={() => handleDebtToggle(debt)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <p className="font-medium text-sm">{typeLabel}</p>
                        <p className="text-xs text-muted-foreground">({monthName})</p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {debt.description || `${typeLabel} - Casa #${houseNumber}`}
                      </p>
                    </div>
                    <p className="font-semibold text-sm whitespace-nowrap">
                      {currencySymbol}
                      {debt.amount.toLocaleString("es-CL")}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Form Sidebar */}
      <div>
        <DebtPaymentForm
          houseId={houseId}
          condoId={condoId}
          houseName={`Casa #${houseNumber}`}
          totalDebt={totalDebt}
          currencySymbol={currencySymbol}
          selectedDebts={selectedDebts}
          selectedTotal={selectedTotal}
          baseCommonTotal={commonExpenseTotal}
          baseVariableTotal={variableExpenseTotal}
          commonTotal={commonExpenseTotal}
          variableTotal={variableExpenseTotal}
          fixedExemptionPercent={0}
          variableExemptionPercent={0}
        />
      </div>
    </div>
  )
}
