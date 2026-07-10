"use client"

import React, { createContext, useContext, useState } from "react"

interface SelectedDebt {
  id: string
  amount: number
}

interface DebtSelectionContextType {
  selectedDebts: SelectedDebt[]
  selectedTotal: number
  setSelectedDebts: (debts: SelectedDebt[]) => void
  addDebt: (debt: SelectedDebt) => void
  removeDebt: (debtId: string) => void
  clearAll: () => void
}

const DebtSelectionContext = createContext<DebtSelectionContextType | undefined>(
  undefined
)

export function DebtSelectionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [selectedDebts, setSelectedDebts] = useState<SelectedDebt[]>([])

  const selectedTotal = selectedDebts.reduce((sum, debt) => sum + debt.amount, 0)

  const addDebt = (debt: SelectedDebt) => {
    setSelectedDebts((prev) => {
      // Check if already exists
      if (prev.find((d) => d.id === debt.id)) {
        return prev
      }
      return [...prev, debt]
    })
  }

  const removeDebt = (debtId: string) => {
    setSelectedDebts((prev) => prev.filter((d) => d.id !== debtId))
  }

  const clearAll = () => {
    setSelectedDebts([])
  }

  return (
    <DebtSelectionContext.Provider
      value={{
        selectedDebts,
        selectedTotal,
        setSelectedDebts,
        addDebt,
        removeDebt,
        clearAll,
      }}
    >
      {children}
    </DebtSelectionContext.Provider>
  )
}

export function useDebtSelection() {
  const context = useContext(DebtSelectionContext)
  if (context === undefined) {
    throw new Error(
      "useDebtSelection must be used within a DebtSelectionProvider"
    )
  }
  return context
}
