"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { payInfractionInstallment } from "@/app/dashboard/actions"

interface PendingFine {
  id: string
  description: string
  fine_amount: number
  amount_pending: number
  currency: string
  payment_status: string
  infraction_date: string
  house_id: string
}

interface PendingFinesProps {
  fines: PendingFine[]
  currencySymbol: string
  houseId: string
}

export function PendingFines({ fines, currencySymbol, houseId }: PendingFinesProps) {
  const [selectedFine, setSelectedFine] = useState<PendingFine | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentUFValue, setPaymentUFValue] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const pendingFines = fines.filter(f => f.payment_status === "pending" || f.payment_status === "partial")

  if (pendingFines.length === 0) {
    return null
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFine || !paymentAmount) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.set("infraction_id", selectedFine.id)
      formData.set("house_id", selectedFine.house_id)
      formData.set("amount", paymentAmount)
      formData.set("paid_date", new Date().toISOString().split("T")[0])
      formData.set("currency", selectedFine.currency)
      if (selectedFine.currency === "UF" && paymentUFValue) {
        formData.set("uf_value_at_payment", paymentUFValue)
      }

      await payInfractionInstallment(formData)
      setSelectedFine(null)
      setPaymentAmount("")
      setPaymentUFValue("")
    } catch (error) {
      console.error("[v0] Error en pago:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Multas Pendientes
          </CardTitle>
          <CardDescription>Tiene {pendingFines.length} multa(s) con saldo pendiente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingFines.map((fine) => (
            <div key={fine.id} className="border border-red-200 rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-gray-800">{fine.description}</p>
                  <p className="text-sm text-gray-600">{fine.infraction_date}</p>
                </div>
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                  {fine.payment_status === "partial" ? "Parcial" : "Pendiente"}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-600">Monto Original</p>
                  <p className="font-semibold">
                    {fine.currency === "UF" ? `${fine.fine_amount} UF` : `${currencySymbol}${fine.fine_amount.toLocaleString("es-CL")}`}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Saldo Pendiente</p>
                  <p className="font-semibold text-red-700">
                    {fine.currency === "UF" ? `${fine.amount_pending} UF` : `${currencySymbol}${fine.amount_pending.toLocaleString("es-CL")}`}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setSelectedFine(fine)}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                Pagar Cuota
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      {selectedFine && (
        <Dialog open={!!selectedFine} onOpenChange={(open) => !open && (setSelectedFine(null), setPaymentAmount(""), setPaymentUFValue(""))}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Pagar Cuota: {selectedFine.description}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <p><strong>Moneda:</strong> {selectedFine.currency === "UF" ? "UF" : currencySymbol}</p>
                <p><strong>Saldo Pendiente:</strong> {selectedFine.currency === "UF" ? `${selectedFine.amount_pending} UF` : `${currencySymbol}${selectedFine.amount_pending.toLocaleString("es-CL")}`}</p>
              </div>

              {selectedFine.currency === "UF" && (
                <div className="space-y-2">
                  <Label>Valor UF Actual ({currencySymbol})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 40340"
                    value={paymentUFValue}
                    onChange={(e) => setPaymentUFValue(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Cuota a Pagar {selectedFine.currency === "UF" ? "(UF)" : `(${currencySymbol})`}</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={selectedFine.amount_pending}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {selectedFine.currency === "UF" && paymentAmount && paymentUFValue && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm">
                    <strong>Equivalente CLP:</strong> {currencySymbol}{(Number(paymentAmount) * Number(paymentUFValue)).toLocaleString("es-CL", { maximumFractionDigits: 0 })}
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedFine(null)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !paymentAmount}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isSubmitting ? "Procesando..." : "Pagar Cuota"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
