"use client"

import Link from "next/link"
import { AlertCircle, ChevronRight } from "lucide-react"

interface PendingPaymentCardProps {
  houseNumber: string
  ownerName: string
  totalDebt: number
  commonExpense: number
  variableExpense: number
  finesCLP: number
  finesUF: number
  currencySymbol: string
}

export function PendingPaymentCard({
  houseNumber,
  ownerName,
  totalDebt,
  commonExpense,
  variableExpense,
  finesCLP,
  finesUF,
  currencySymbol,
}: PendingPaymentCardProps) {
  const hasUFDebt = finesUF > 0

  return (
    <Link href={`/dashboard/deudas-consolidadas?house=${houseNumber}`}>
      <div className="group flex flex-col gap-4 rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 p-4 hover:bg-red-100 transition-all cursor-pointer hover:shadow-md hover:border-red-400">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-red-900">Casa #{houseNumber}</h3>
              <p className="text-sm text-red-700">{ownerName}</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-red-400 group-hover:translate-x-1 transition-transform" />
        </div>

        {/* Debt Breakdown */}
        <div className="space-y-2 border-t border-red-200 pt-3">
          {commonExpense > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-700">Gasto Común:</span>
              <span className="font-semibold text-red-900">{currencySymbol}{commonExpense.toLocaleString("es-CL")}</span>
            </div>
          )}
          {variableExpense > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-700">Gasto Variable:</span>
              <span className="font-semibold text-red-900">{currencySymbol}{variableExpense.toLocaleString("es-CL")}</span>
            </div>
          )}
          {finesCLP > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-700">Multas CLP:</span>
              <span className="font-semibold text-red-900">{currencySymbol}{finesCLP.toLocaleString("es-CL")}</span>
            </div>
          )}
          {finesUF > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-700">Multas UF:</span>
              <span className="font-semibold text-red-900">{finesUF.toFixed(2)} UF</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between border-t border-red-200 pt-3">
          <span className="font-semibold text-red-900">Total Deuda:</span>
          <div className="flex flex-col items-end">
            <span className="text-lg font-bold text-red-900">
              {currencySymbol}{totalDebt.toLocaleString("es-CL")}
            </span>
            {hasUFDebt && (
              <span className="text-xs text-red-700">+ {finesUF.toFixed(2)} UF</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
