"use client"

import { useState, useMemo, useCallback } from "react"
import { DebtBreakdownClient } from "./debt-breakdown-client"
import { DebtPaymentForm } from "./debt-payment-form"

interface Debt {
  id: string
  amount: number | null
  income_type: string
  description: string | null
  period_month: number
  period_year: number
  currency?: string
}

interface DebtPaymentContainerProps {
  debts: Debt[]
  currencySymbol: string
  houseId: string
  condoId: string
  houseName: string
  totalDebt: number
  baseCommonTotal: number
  baseVariableTotal: number
  commonTotal: number
  variableTotal: number
  fixedExemptionPercent: number
  variableExemptionPercent: number
}

export function DebtPaymentContainer({
  debts,
  currencySymbol,
  houseId,
  condoId,
  houseName,
  totalDebt,
  baseCommonTotal,
  baseVariableTotal,
  commonTotal,
  variableTotal,
  fixedExemptionPercent,
  variableExemptionPercent,
}: DebtPaymentContainerProps) {
  const [selectedDebts, setSelectedDebts] = useState<Debt[]>([])

  const selectedTotal = selectedDebts.reduce((sum, debt) => sum + (debt.amount || 0), 0)

  // Stable reference so the child's effect doesn't loop on every render.
  const normalizedDebts = useMemo(
    () =>
      debts.map((d) => ({
        ...d,
        description: d.description || "Sin descripción",
        amount: d.amount || 0,
        currency: d.currency || "",
      })),
    [debts],
  )

  // Stable callback so the child's effect dependency doesn't change each render.
  const handleSelectionChange = useCallback((selected: unknown) => {
    setSelectedDebts(selected as Debt[])
  }, [])

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Deudas Selection */}
      <div className="lg:col-span-2">
        <DebtBreakdownClient 
          debts={normalizedDebts} 
          currencySymbol={currencySymbol}
          onSelectionChange={handleSelectionChange}
        />
      </div>

      {/* Payment Form */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Informar Pago</h2>
        <DebtPaymentForm
          houseId={houseId}
          condoId={condoId}
          houseName={houseName}
          totalDebt={totalDebt}
          currencySymbol={currencySymbol}
          selectedDebts={selectedDebts}
          selectedTotal={selectedTotal}
          baseCommonTotal={baseCommonTotal}
          baseVariableTotal={baseVariableTotal}
          commonTotal={commonTotal}
          variableTotal={variableTotal}
          fixedExemptionPercent={fixedExemptionPercent}
          variableExemptionPercent={variableExemptionPercent}
        />
      </div>
    </div>
  )
}
