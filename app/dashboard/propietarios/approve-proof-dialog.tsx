"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, FileCheck, ExternalLink, AlertTriangle } from "lucide-react"

interface ApproveProofDialogProps {
  proof: any
  house: any
  fixedAmount: number
  variableAmount: number
  finesAmount?: number
  currencySymbol: string
  infractions?: any[]
}

export function ApproveProofDialog({
  proof,
  house,
  fixedAmount,
  variableAmount,
  finesAmount = 0,
  currencySymbol,
  infractions = [],
}: ApproveProofDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<"approve" | "reject" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const paymentType = proof.payment_type || "gastos_comunes"
  const isGastosComunes = paymentType === "gastos_comunes"
  const totalAmount = isGastosComunes ? fixedAmount + variableAmount : (proof.fines_amount || finesAmount)

  async function handleApprove() {
    setLoading(true)
    setAction("approve")
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      const today = new Date().toISOString().split("T")[0]

      if (isGastosComunes) {
        // Find EXISTING income records for this house/period (created from Parameters)
        const { data: existingIncomes } = await supabase
          .from("condo_income")
          .select("id, income_type")
          .eq("condo_id", proof.condo_id)
          .eq("house_id", proof.house_id)
          .eq("period_month", proof.period_month)
          .eq("period_year", proof.period_year)

        const fixedIncome = existingIncomes?.find(i => i.income_type === "fixed" || i.income_type === "gasto_comun" || i.income_type === "cuota")
        const variableIncome = existingIncomes?.find(i => i.income_type === "variable" || i.income_type === "gasto_comun_variable")

        // Update existing income records to approved status with receipt URL
        if (fixedIncome) {
          const { error: fixedError } = await supabase
            .from("condo_income")
            .update({
              status: "approved",
              receipt_url: proof.receipt_url,
            })
            .eq("id", fixedIncome.id)

          if (fixedError) throw fixedError
        }

        if (variableIncome) {
          const { error: variableError } = await supabase
            .from("condo_income")
            .update({
              status: "approved",
              receipt_url: proof.receipt_url,
            })
            .eq("id", variableIncome.id)

          if (variableError) throw variableError
        }

        // Update proof status with income IDs
        const { error: updateError } = await supabase
          .from("payment_proofs")
          .update({
            status: "approved",
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            fixed_income_id: fixedIncome?.id || null,
            variable_income_id: variableIncome?.id || null,
          })
          .eq("id", proof.id)

        if (updateError) throw updateError
      } else {
        // For fines - create income record for fines
        const { data: fineIncome, error: fineError } = await supabase
          .from("condo_income")
          .insert({
            condo_id: proof.condo_id,
            house_id: proof.house_id,
            income_type: "multa",
            amount: totalAmount,
            income_date: today,
            period_month: proof.period_month,
            period_year: proof.period_year,
            description: `Pago de multas - Casa #${house.house_number}`,
            receipt_url: proof.receipt_url,
            created_by: user.id,
          })
          .select()
          .single()

        if (fineError) throw fineError

        // Update infractions to paid status
        if (infractions.length > 0) {
          const infractionIds = infractions.map((inf: any) => inf.id)
          const { error: infError } = await supabase
            .from("infractions")
            .update({ status: "pagada" })
            .in("id", infractionIds)
          
          if (infError) throw infError
        }

        // Update proof status
        const { error: updateError } = await supabase
          .from("payment_proofs")
          .update({
            status: "approved",
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", proof.id)

        if (updateError) throw updateError
      }

      setOpen(false)
      router.refresh()
    } catch (err: any) {
      console.error("[v0] Error approving proof:", err)
      setError(err.message || "Error al aprobar el comprobante")
    } finally {
      setLoading(false)
      setAction(null)
    }
  }

  async function handleReject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setAction("reject")
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      const formData = new FormData(e.currentTarget)
      const reason = formData.get("rejection_reason") as string

      if (!reason?.trim()) {
        setError("Debes indicar el motivo del rechazo")
        setLoading(false)
        setAction(null)
        return
      }

      const { error: updateError } = await supabase
        .from("payment_proofs")
        .update({
          status: "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason.trim(),
        })
        .eq("id", proof.id)

      if (updateError) throw updateError

      setOpen(false)
      router.refresh()
    } catch (err: any) {
      console.error("[v0] Error rejecting proof:", err)
      setError(err.message || "Error al rechazar el comprobante")
    } finally {
      setLoading(false)
      setAction(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileCheck className="h-4 w-4 mr-2" />
          Revisar Comprobante
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            Revisar Comprobante de Pago
            {!isGastosComunes && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Multas
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Casa #{house.house_number} - {house.owner_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Payment Type Badge */}
          <div className={`p-2 rounded-lg text-center text-sm font-medium ${isGastosComunes ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"}`}>
            {isGastosComunes ? "Comprobante de Gastos Comunes" : "Comprobante de Pago de Multas"}
          </div>

          {/* Receipt Image */}
          <div className="space-y-2">
            <Label className="text-slate-900 dark:text-slate-200">Comprobante Enviado</Label>
            {proof.receipt_url && (
              <div className="relative">
                <img
                  src={proof.receipt_url}
                  alt="Comprobante"
                  className="w-full max-h-48 object-contain rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800"
                  crossOrigin="anonymous"
                />
                <a
                  href={proof.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 p-2 rounded-lg bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                  title="Ver en pantalla completa"
                >
                  <ExternalLink className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                </a>
              </div>
            )}
            {proof.notes && (
              <p className="text-sm text-slate-600 dark:text-slate-400">Nota: {proof.notes}</p>
            )}
          </div>

          {/* Amount Summary */}
          <div className={`p-3 rounded-lg space-y-1 ${isGastosComunes ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100" : "bg-red-50 dark:bg-red-900/20 text-slate-900 dark:text-slate-100"}`}>
            {isGastosComunes ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Gasto Fijo</span>
                  <span className="font-medium text-slate-900 dark:text-white">{currencySymbol}{fixedAmount.toLocaleString("es-CL")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Gasto Variable</span>
                  <span className="font-medium text-slate-900 dark:text-white">{currencySymbol}{variableAmount.toLocaleString("es-CL")}</span>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">Multas Incluidas:</p>
                {infractions.length > 0 ? (
                  infractions.map((inf: any) => (
                    <div key={inf.id} className="flex justify-between text-sm">
                      <span className="text-red-600 dark:text-red-400">{inf.description || inf.infraction_type}</span>
                      <span className="font-medium text-red-700 dark:text-red-400">{currencySymbol}{(inf.fine_amount || 0).toLocaleString("es-CL")}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600 dark:text-red-400">Multas</span>
                    <span className="font-medium text-red-700 dark:text-red-400">{currencySymbol}{totalAmount.toLocaleString("es-CL")}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between font-medium pt-1 border-t border-slate-300 dark:border-slate-600">
              <span className="text-slate-900 dark:text-white">Total</span>
              <span className={isGastosComunes ? "text-blue-700 dark:text-blue-400" : "text-red-700 dark:text-red-400"}>
                {currencySymbol}{totalAmount.toLocaleString("es-CL")}
              </span>
            </div>
          </div>

          {/* Approve Button */}
          <Button
            onClick={handleApprove}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            disabled={loading}
          >
            {loading && action === "approve" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <CheckCircle className="h-4 w-4 mr-2" />
            {isGastosComunes ? "Aprobar y Registrar Ingresos" : "Aprobar y Marcar Multas como Pagadas"}
          </Button>

          {/* Reject Form */}
          <div className="pt-3 border-t border-slate-300 dark:border-slate-600">
            <form onSubmit={handleReject} className="space-y-2">
              <Label htmlFor="rejection_reason" className="text-sm text-slate-900 dark:text-slate-200">Motivo de Rechazo (opcional)</Label>
              <Textarea
                id="rejection_reason"
                name="rejection_reason"
                placeholder="Ej: Monto no coincide, imagen ilegible..."
                rows={2}
                className="text-sm border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                disabled={loading}
              >
                {loading && action === "reject" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
