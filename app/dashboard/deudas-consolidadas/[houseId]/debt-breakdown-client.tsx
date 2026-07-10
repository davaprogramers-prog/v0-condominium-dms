"use client"

import { useState, useMemo, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"

interface DebtItem {
  id: string
  description: string
  amount: number
  income_type: string
  period_month: number
  period_year: number
  currency: string
}

interface DebtBreakdownClientProps {
  debts: DebtItem[]
  currencySymbol: string
  selectedDebts?: DebtItem[]
  onSelectionChange?: (debts: DebtItem[]) => void
}

// Format number without locale to avoid hydration issues
const formatNumber = (num: number | null | undefined): string => {
  if (!num) return "0"
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export function DebtBreakdownClient({ 
  debts, 
  currencySymbol,
  selectedDebts: propsSelectedDebts,
  onSelectionChange
}: DebtBreakdownClientProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const monthNames = ["", "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

  // Group debts by type
  const debtsByType = useMemo(() => {
    return {
      fixed: debts.filter((d) => d.income_type === "fixed"),
      variable: debts.filter((d) => d.income_type === "variable"),
      multa: debts.filter((d) => d.income_type === "multa"),
    }
  }, [debts])

  // Calculate selected total
  const selectedTotal = useMemo(() => {
    return Array.from(selectedIds).reduce((sum, id) => {
      const debt = debts.find((d) => d.id === id)
      return sum + (debt?.amount || 0)
    }, 0)
  }, [selectedIds, debts])

  // Get selected debts for form
  const selectedDebtsArray = useMemo(() => {
    return Array.from(selectedIds).map((id) => {
      const debt = debts.find((d) => d.id === id)
      return { id, amount: debt?.amount || 0 }
    })
  }, [selectedIds, debts])

  // Notify parent component when selection changes
  useEffect(() => {
    if (onSelectionChange) {
      const selected = debts.filter((d) => selectedIds.has(d.id))
      onSelectionChange(selected)
    }
  }, [selectedIds, debts, onSelectionChange])

  const handleToggle = (debtId: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(debtId)) {
      newSelected.delete(debtId)
    } else {
      newSelected.add(debtId)
    }
    setSelectedIds(newSelected)
  }

  const handleSelectAll = (type: "fixed" | "variable" | "multa") => {
    const typeDebts = debtsByType[type]
    const allSelected = typeDebts.every((d) => selectedIds.has(d.id))
    const newSelected = new Set(selectedIds)

    typeDebts.forEach((d) => {
      if (allSelected) {
        newSelected.delete(d.id)
      } else {
        newSelected.add(d.id)
      }
    })

    setSelectedIds(newSelected)
  }

  const renderDebtType = (type: "fixed" | "variable" | "multa", label: string, color: string) => {
    const typeDebts = debtsByType[type]
    if (typeDebts.length === 0) return null

    const typeSelected = typeDebts.filter((d) => selectedIds.has(d.id)).length
    const allTypeSelected = typeSelected === typeDebts.length && typeDebts.length > 0

    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-semibold ${color}`}>
            {label} ({typeDebts.length})
          </h3>
          <button
            onClick={() => handleSelectAll(type)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            {allTypeSelected ? "Desmarcar todo" : "Marcar todo"}
          </button>
        </div>
        <div className="space-y-2 text-sm">
          {typeDebts.map((expense) => {
            const monthStr = monthNames[expense.period_month] || ""
            const yearStr = String(expense.period_year).slice(-2)
            const period = monthStr && yearStr ? `(${monthStr}-${yearStr})` : ""
            const isSelected = selectedIds.has(expense.id)

            return (
              <div
                key={expense.id}
                className={`flex items-center gap-3 p-2 rounded transition-colors cursor-pointer ${
                  isSelected ? "bg-blue-50" : "hover:bg-muted"
                }`}
                onClick={() => handleToggle(expense.id)}
              >
                <Checkbox checked={isSelected} onChange={() => handleToggle(expense.id)} />
                <div className="flex-1 text-muted-foreground">
                  <div>{expense.description || "Gasto"}</div>
                  {period && <div className="text-xs text-muted-foreground/70">{period}</div>}
                </div>
                <span className="font-medium flex-shrink-0 whitespace-nowrap">
                  {expense.currency === "CLP" || type !== "multa" ? currencySymbol : ""}
                  {formatNumber(expense.amount)}
                  {expense.currency === "UF" ? " UF" : ""}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Store selected debts in a hidden input for form submission
  const formDataId = "selected-debts"
  
  return (
    <>
      <input type="hidden" id={formDataId} value={JSON.stringify(selectedDebtsArray)} />
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Desglose de Deudas</h2>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Monto Seleccionado</p>
            <p className="text-2xl font-bold text-blue-600">
              {currencySymbol}
              {formatNumber(selectedTotal)}
            </p>
          </div>
        </div>

        {renderDebtType("fixed", "Gastos Comunes", "text-blue-600")}
        {renderDebtType("variable", "Gastos Variables", "text-amber-600")}
        {renderDebtType("multa", "Multas", "text-red-600")}
        
        {selectedIds.size === 0 && (
          <div className="rounded-lg border border-dashed bg-muted/50 p-4 text-center text-muted-foreground">
            Selecciona las deudas que deseas pagar
          </div>
        )}
      </div>

      {/* Pass data to DebtPaymentForm via context */}
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `
            window.selectedDebts = ${JSON.stringify(selectedDebtsArray)};
            window.selectedTotal = ${selectedTotal};
          `,
        }}
      />
    </>
  )
}
