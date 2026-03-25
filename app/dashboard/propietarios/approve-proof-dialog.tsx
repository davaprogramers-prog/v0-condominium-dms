"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, XCircle, Loader2, FileCheck, ExternalLink } from "lucide-react"

interface ApproveProofDialogProps {
  proof: any
  house: any
  fixedAmount: number
  variableAmount: number
  currencySymbol: string
}

export function ApproveProofDialog({
  proof,
  house,
  fixedAmount,
  variableAmount,
  currencySymbol,
}: ApproveProofDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<"approve" | "reject" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const totalAmount = fixedAmount + variableAmount

  async function handleApprove() {
    setLoading(true)
    setAction("approve")
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      const today = new Date().toISOString().split("T")[0]

      // Create fixed income record
      const { data: fixedIncome, error: fixedError } = await supabase
        .from("condo_income")
        .insert({
          condo_id: proof.condo_id,
          house_id: proof.house_id,
          income_type: "gasto_comun",
          amount: fixedAmount,
          income_date: today,
          period_month: proof.period_month,
          period_year: proof.period_year,
          description: `Gasto comun fijo - Casa #${house.house_number}`,
          receipt_url: proof.receipt_url,
          created_by: user.id,
        })
        .select()
        .single()

      if (fixedError) throw fixedError

      // Create variable income record
      const { data: variableIncome, error: variableError } = await supabase
        .from("condo_income")
        .insert({
          condo_id: proof.condo_id,
          house_id: proof.house_id,
          income_type: "gasto_comun_variable",
          amount: variableAmount,
          income_date: today,
          period_month: proof.period_month,
          period_year: proof.period_year,
          description: `Gasto comun variable - Casa #${house.house_number}`,
          receipt_url: proof.receipt_url,
          created_by: user.id,
        })
        .select()
        .single()

      if (variableError) throw variableError

      // Update proof status
      const { error: updateError } = await supabase
        .from("payment_proofs")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          fixed_income_id: fixedIncome.id,
          variable_income_id: variableIncome.id,
        })
        .eq("id", proof.id)

      if (updateError) throw updateError

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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Revisar Comprobante de Pago</DialogTitle>
          <DialogDescription>
            Casa #{house.house_number} - {house.owner_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Receipt Image */}
          <div className="space-y-2">
            <Label>Comprobante Enviado</Label>
            {proof.receipt_url && (
              <div className="relative">
                <img
                  src={proof.receipt_url}
                  alt="Comprobante"
                  className="w-full max-h-64 object-contain rounded-lg border bg-muted"
                />
                <a
                  href={proof.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 p-2 rounded-lg bg-background/80 hover:bg-background transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}
            {proof.notes && (
              <p className="text-sm text-muted-foreground">Nota: {proof.notes}</p>
            )}
          </div>

          {/* Amount Summary */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gasto Comun Fijo</span>
              <span>{currencySymbol}{fixedAmount.toLocaleString("es-CL")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gasto Comun Variable</span>
              <span>{currencySymbol}{variableAmount.toLocaleString("es-CL")}</span>
            </div>
            <div className="flex justify-between font-medium pt-2 border-t">
              <span>Total Esperado</span>
              <span className="text-primary">{currencySymbol}{totalAmount.toLocaleString("es-CL")}</span>
            </div>
          </div>

          {/* Approve Button */}
          <Button
            onClick={handleApprove}
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            {loading && action === "approve" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprobar y Registrar Ingresos
          </Button>

          {/* Reject Form */}
          <div className="pt-4 border-t">
            <form onSubmit={handleReject} className="space-y-3">
              <Label htmlFor="rejection_reason">Motivo de Rechazo</Label>
              <Textarea
                id="rejection_reason"
                name="rejection_reason"
                placeholder="Ej: Monto no coincide, imagen ilegible..."
                rows={2}
              />
              <Button
                type="submit"
                variant="destructive"
                className="w-full"
                disabled={loading}
              >
                {loading && action === "reject" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar Comprobante
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
