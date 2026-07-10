"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, XCircle, Loader2, Trash2 } from "lucide-react"

interface ApproveProofDialogProps {
  proof: any
  house: any
  fixedAmount: number
  variableAmount: number
  finesAmount?: number
  currencySymbol: string
  infractions?: any[]
}

export function ProofApprovalDialog({
  proof,
  house,
  fixedAmount,
  variableAmount,
  finesAmount = 0,
  currencySymbol,
  infractions = [],
}: ApproveProofDialogProps) {
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<"approve" | "reject" | "delete" | null>(null)
  const [error, setError] = useState<string>("")
  const [userRole, setUserRole] = useState<string | null>(null)
  const rejectionReasonRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  // Get user role on mount
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()
        setUserRole(profile?.role || null)
      }
    })
  }, [])

  // State for reject form visibility
  const [showRejectForm, setShowRejectForm] = useState(false)

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

      // Validate required fields
      if (!proof.condo_id) {
        throw new Error("Comprobante sin condominio asignado")
      }

      const today = new Date().toISOString().split("T")[0]
      // Set income_date to the first day of the period for consistency
      const periodDate = new Date(proof.period_year, proof.period_month - 1, 1)
      const incomeDateForPeriod = periodDate.toISOString().split("T")[0]

      if (isGastosComunes) {
        // For consolidated debts: update the linked income records from payment_proofs
        // These are already linked via fixed_income_id and variable_income_id
        
        // Update fixed income if linked
        if (proof.fixed_income_id) {
          const { error: fixedError } = await supabase
            .from("condo_income")
            .update({
              status: "approved",
              receipt_url: proof.receipt_url,
              income_date: incomeDateForPeriod,
            })
            .eq("id", proof.fixed_income_id)

          if (fixedError) throw fixedError
        }

        // Update variable income if linked
        if (proof.variable_income_id) {
          const { error: variableError } = await supabase
            .from("condo_income")
            .update({
              status: "approved",
              receipt_url: proof.receipt_url,
              income_date: incomeDateForPeriod,
            })
            .eq("id", proof.variable_income_id)

          if (variableError) throw variableError
        }

        // If no linked income (regular propietarios payment), find existing records
        if (!proof.fixed_income_id && !proof.variable_income_id) {
          const { data: existingIncomes } = await supabase
            .from("condo_income")
            .select("id, income_type")
            .eq("condo_id", proof.condo_id)
            .eq("house_id", proof.house_id)
            .eq("period_month", proof.period_month)
            .eq("period_year", proof.period_year)

          const fixedIncome = existingIncomes?.find(i => i.income_type === "fixed" || i.income_type === "gasto_comun" || i.income_type === "cuota")
          const variableIncome = existingIncomes?.find(i => i.income_type === "variable" || i.income_type === "gasto_comun_variable")

          // Update existing income records to approved status with receipt URL and aligned income_date
          if (fixedIncome) {
            const { error: fixedError } = await supabase
              .from("condo_income")
              .update({
                status: "approved",
                receipt_url: proof.receipt_url,
                income_date: incomeDateForPeriod,
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
                income_date: incomeDateForPeriod,
              })
              .eq("id", variableIncome.id)

            if (variableError) throw variableError
          }
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
      } else {
        // For fines - create income record for fines
        const { data: fineIncome, error: fineError } = await supabase
          .from("condo_income")
          .insert({
            condo_id: proof.condo_id,
            house_id: proof.house_id,
            income_type: "multa",
            amount: totalAmount,
            income_date: incomeDateForPeriod,
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

      const reason = rejectionReasonRef.current?.value || ""

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

      router.refresh()
    } catch (err: any) {
      console.error("[v0] Error rejecting proof:", err)
      setError(err.message || "Error al rechazar el comprobante")
    } finally {
      setLoading(false)
      setAction(null)
    }
  }

  async function handleDelete() {
    // Verify user is admin or super_admin
    if (!userRole || (userRole !== "admin" && userRole !== "super_admin")) {
      setError("No tienes permiso para eliminar comprobantes")
      return
    }

    // Confirm deletion
    if (!window.confirm("¿Estás seguro de que deseas eliminar este comprobante? Esta acción no se puede deshacer.")) {
      return
    }

    setLoading(true)
    setAction("delete")
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      // Delete the proof
      const { error: deleteError } = await supabase
        .from("payment_proofs")
        .delete()
        .eq("id", proof.id)

      if (deleteError) throw deleteError

      // If there's a receipt URL, try to delete it from storage
      if (proof.receipt_url) {
        try {
          const fileName = proof.receipt_url.split("/").pop()
          if (fileName) {
            await supabase.storage
              .from("payment_receipts")
              .remove([fileName])
          }
        } catch (storageErr) {
          console.error("[v0] Error deleting storage file:", storageErr)
          // Don't throw - the proof is already deleted from DB
        }
      }

      router.refresh()
    } catch (err: any) {
      console.error("[v0] Error deleting proof:", err)
      setError(err.message || "Error al eliminar el comprobante")
    } finally {
      setLoading(false)
      setAction(null)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm border-l-4 border-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleApprove}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          disabled={loading}
        >
          {loading && action === "approve" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <CheckCircle className="h-4 w-4 mr-2" />
          Aprobar
        </Button>

        <Button
          onClick={() => setAction("reject")}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          disabled={loading || action !== null}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Rechazar
        </Button>
      </div>

      {action === "reject" && (
        <form onSubmit={handleReject} className="space-y-2 border-t pt-4">
          <Label htmlFor="rejection_reason" className="text-sm font-medium">Motivo de Rechazo</Label>
          <Textarea
            ref={rejectionReasonRef}
            id="rejection_reason"
            name="rejection_reason"
            placeholder="Ej: Monto no coincide, imagen ilegible..."
            rows={2}
            className="border rounded-lg"
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={loading}
            >
              {loading && action === "reject" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Rechazo
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setAction(null)}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {userRole && (userRole === "admin" || userRole === "super_admin") && (
        <Button
          onClick={handleDelete}
          className="w-full bg-black hover:bg-gray-800 text-white dark:bg-gray-700 dark:hover:bg-gray-600"
          disabled={loading}
        >
          {loading && action === "delete" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar Comprobante
        </Button>
      )}
    </div>
  )
}
