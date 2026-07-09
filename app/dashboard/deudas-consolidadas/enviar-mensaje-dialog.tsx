"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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

interface EnviarMensajeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deuda: DeudaConsolidada
  currencySymbol: string
  theme: CondoTheme
  condoId: string
  userId: string
}

function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

export function EnviarMensajeDialog({
  open,
  onOpenChange,
  deuda,
  currencySymbol,
  theme,
  condoId,
  userId,
}: EnviarMensajeDialogProps) {
  const [mensaje, setMensaje] = useState("")
  const [incluirDetalles, setIncluirDetalles] = useState(true)
  const [isSending, setIsSending] = useState(false)

  const generarMensajeAutomatico = () => {
    let msg = `Estimado(a) ${deuda.ownerName || "residente"},\n\n`
    msg += `Le informamos que tiene deuda pendiente en su cuenta de la Casa #${deuda.houseNumber}:\n\n`

    if (deuda.commonExpenses > 0) {
      msg += `• Gastos Comunes: ${formatCurrency(deuda.commonExpenses, currencySymbol)}\n`
    }
    if (deuda.variableExpenses > 0) {
      msg += `• Gastos Variables: ${formatCurrency(deuda.variableExpenses, currencySymbol)}\n`
    }
    if (deuda.finesAmount > 0) {
      msg += `• Multas: ${formatCurrency(deuda.finesAmount, currencySymbol)}\n`
    }
    if (deuda.finesUF > 0) {
      msg += `• Multas en UF: ${deuda.finesUF.toFixed(2)} UF\n`
    }

    msg += `\nTotal a pagar: ${formatCurrency(deuda.totalDebt, currencySymbol)}`
    if (deuda.finesUF > 0) {
      msg += ` + ${deuda.finesUF.toFixed(2)} UF`
    }
    msg += `\n\nPor favor, proceda a realizar el pago lo antes posible.\n\nSaludos cordiales`

    setMensaje(msg)
  }

  const handleSendMessage = async () => {
    if (!mensaje.trim()) return

    setIsSending(true)
    try {
      // TODO: Implementar acción para enviar mensaje
      // Por ahora, solo mostrar mensaje de éxito
      console.log("[v0] Mensaje a enviar:", {
        houseId: deuda.houseId,
        residentName: deuda.ownerName,
        message: mensaje,
        totalDebt: deuda.totalDebt,
      })

      // Simular envío
      await new Promise((resolve) => setTimeout(resolve, 1000))

      alert("Mensaje enviado correctamente")
      onOpenChange(false)
      setMensaje("")
      setIncluirDetalles(true)
    } catch (error) {
      console.error("[v0] Error al enviar mensaje:", error)
      alert("Error al enviar el mensaje")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          backgroundColor: theme.dialog_bg_color,
          color: theme.dialog_text_color,
        }}
        className="max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle style={{ color: theme.dialog_text_color }}>
            Enviar Mensaje - Casa #{deuda.houseNumber}
          </DialogTitle>
          <DialogDescription style={{ color: theme.dialog_text_color, opacity: 0.7 }}>
            {deuda.ownerName || "Sin asignar"} - Deuda total:{" "}
            {formatCurrency(deuda.totalDebt, currencySymbol)}
            {deuda.finesUF > 0 && ` + ${deuda.finesUF.toFixed(2)} UF`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Opción de generar mensaje automático */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-message"
              checked={incluirDetalles}
              onCheckedChange={(checked) => setIncluirDetalles(!!checked)}
            />
            <Label htmlFor="auto-message" style={{ color: theme.dialog_text_color }}>
              Generar mensaje automático con detalles de deuda
            </Label>
          </div>

          {incluirDetalles && (
            <Button
              type="button"
              variant="outline"
              onClick={generarMensajeAutomatico}
              style={{
                borderColor: theme.dialog_text_color,
                color: theme.dialog_text_color,
              }}
            >
              Generar Mensaje
            </Button>
          )}

          {/* Área de texto para el mensaje */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="message" style={{ color: theme.dialog_text_color }}>
              Mensaje
            </Label>
            <Textarea
              id="message"
              placeholder="Escriba el mensaje que desea enviar..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={10}
              style={{
                backgroundColor: theme.input_bg_color,
                borderColor: theme.dialog_text_color,
                color: theme.input_text_color,
              }}
            />
            <p className="text-xs" style={{ color: theme.dialog_text_color, opacity: 0.6 }}>
              {mensaje.length} caracteres
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 justify-end pt-4 border-t" style={{ borderColor: theme.dialog_text_color, borderOpacity: 0.1 }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSending}
              style={{
                borderColor: theme.dialog_text_color,
                color: theme.dialog_text_color,
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSendMessage}
              disabled={isSending || !mensaje.trim()}
            >
              {isSending ? "Enviando..." : "Enviar Mensaje"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
