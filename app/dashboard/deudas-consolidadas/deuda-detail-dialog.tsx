"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { type CondoTheme } from "@/lib/theme-utils"

interface DeudaConsolidada {
  houseNumber: string | number
  ownerName: string | null
  houseId: string
  commonExpenses: number
  variableExpenses: number
  finesAmount: number
  finesUF: number
  totalDebt: number
  detailsCount: number
}

interface DeudaDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deuda: DeudaConsolidada
  currencySymbol: string
  theme: CondoTheme
}

function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

export function DeudaDetailDialog({
  open,
  onOpenChange,
  deuda,
  currencySymbol,
  theme,
}: DeudaDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          backgroundColor: theme.dialog_bg_color,
          color: theme.dialog_text_color,
        }}
        className="max-w-lg"
      >
        <DialogHeader>
          <DialogTitle style={{ color: theme.dialog_text_color }}>
            Detalles de Deuda - Casa #{deuda.houseNumber}
          </DialogTitle>
          <DialogDescription style={{ color: theme.dialog_text_color, opacity: 0.7 }}>
            {deuda.ownerName || "Sin asignar"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumen por tipo */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm" style={{ color: theme.dialog_text_color }}>
              Desglose por Tipo
            </h3>

            <div className="space-y-2">
              {/* Gastos Comunes */}
              {deuda.commonExpenses > 0 && (
                <div className="flex justify-between items-center p-3 rounded bg-opacity-20" style={{ backgroundColor: "#3b82f6" }}>
                  <span style={{ color: theme.dialog_text_color }}>Gastos Comunes</span>
                  <Badge className="bg-blue-600 text-white">
                    {formatCurrency(deuda.commonExpenses, currencySymbol)}
                  </Badge>
                </div>
              )}

              {/* Gastos Variables */}
              {deuda.variableExpenses > 0 && (
                <div className="flex justify-between items-center p-3 rounded bg-opacity-20" style={{ backgroundColor: "#8b5cf6" }}>
                  <span style={{ color: theme.dialog_text_color }}>Gastos Variables</span>
                </div>
              )}

              {/* Multas en CLP */}
              {deuda.finesAmount > 0 && (
                <div className="flex justify-between items-center p-3 rounded bg-opacity-20" style={{ backgroundColor: "#f59e0b" }}>
                  <span style={{ color: theme.dialog_text_color }}>Multas (CLP)</span>
                </div>
              )}

              {/* Multas en UF */}
              {deuda.finesUF > 0 && (
                <div className="flex justify-between items-center p-3 rounded bg-opacity-20" style={{ backgroundColor: "#06b6d4" }}>
                  <span style={{ color: theme.dialog_text_color }}>Multas (UF)</span>
                  <Badge className="bg-cyan-600 text-white">
                    {deuda.finesUF.toFixed(2)} UF
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Información adicional */}
          <div className="border-t pt-4" style={{ borderColor: theme.dialog_text_color }}>
            <div className="flex justify-between items-center">
              <span className="font-semibold" style={{ color: theme.dialog_text_color }}>
                Total a Cobrar
              </span>
              <div className="text-right">
                <p className="text-lg font-bold" style={{ color: "#ef4444" }}>
                  {formatCurrency(deuda.totalDebt, currencySymbol)}
                </p>
                {deuda.finesUF > 0 && (
                  <p className="text-sm" style={{ color: "#06b6d4" }}>
                    + {deuda.finesUF.toFixed(2)} UF
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs mt-4" style={{ color: theme.dialog_text_color, opacity: 0.6 }}>
              Hay {deuda.detailsCount} concepto(s) con deuda pendiente
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
