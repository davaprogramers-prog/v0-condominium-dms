"use client"

import { useState } from "react"
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
  houseName: string
  totalDebt: number
}

export function DebtPaymentContainer({
  debts,
  currencySymbol,
  houseId,
  houseName,
  totalDebt,
}: DebtPaymentContainerProps) {
  const [selectedDebts, setSelectedDebts] = useState<Debt[]>([])

  const selectedTotal = selectedDebts.reduce((sum, debt) => sum + (debt.amount || 0), 0)

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Deudas Selection */}
      <div className="lg:col-span-2">
        <DebtBreakdownClient 
          debts={debts} 
          currencySymbol={currencySymbol}
          selectedDebts={selectedDebts}
          onSelectionChange={setSelectedDebts}
        />
      </div>

      {/* Payment Form */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Informar Pago</h2>
        <DebtPaymentForm
          houseId={houseId}
          houseName={houseName}
          totalDebt={totalDebt}
          currencySymbol={currencySymbol}
          selectedDebts={selectedDebts}
          selectedTotal={selectedTotal}
        />
      </div>
    </div>
  )
}
