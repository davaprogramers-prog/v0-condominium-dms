"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface PaymentUploadDialogProps {
  condoId: string
  houseId: string
  currencySymbol?: string
}

export function PaymentUploadDialog({ condoId, houseId, currencySymbol }: PaymentUploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    const supabase = createClient()

    try {
      // Upload file to storage
      const fileName = `${houseId}/${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, file)

      if (uploadError) {
        console.error("[v0] Upload error:", uploadError)
        setLoading(false)
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("receipts")
        .getPublicUrl(fileName)

      // Create payment receipt record
      // First, get the current income for this month
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user?.id)
        .single()

      // Get current month parameters and income amounts
      const { data: parameters } = await supabase
        .from("parameters")
        .select("current_month, current_year, fixed_income_amount, variable_income_amount")
        .eq("condo_id", condoId)
        .single()

      if (!parameters) {
        alert("Error: No se encontraron parámetros del condominio.")
        setLoading(false)
        return
      }

      // Find ALL income records for this house this month (fixed + variable)
      const { data: incomes } = await supabase
        .from("condo_income")
        .select("id, income_type, amount")
        .eq("house_id", houseId)
        .eq("condo_id", condoId)
        .eq("period_month", parameters.current_month)
        .eq("period_year", parameters.current_year)

      if (incomes && incomes.length > 0) {
        // Find fixed and variable income IDs and amounts
        const fixedIncome = incomes.find(i => i.income_type === 'fixed')
        const variableIncome = incomes.find(i => i.income_type === 'variable')

        // Check if there's already an APPROVED proof for this house/period - block if so
        const { data: approvedProof } = await supabase
          .from("payment_proofs")
          .select("id")
          .eq("house_id", houseId)
          .eq("period_month", parameters.current_month)
          .eq("period_year", parameters.current_year)
          .eq("status", "approved")
          .single()

        if (approvedProof) {
          alert("El pago de este mes ya fue aprobado. No puede subir otro comprobante.")
          setLoading(false)
          return
        }

        // Check if there's a pending/rejected proof for this house/period (to update)
        const { data: existingProof } = await supabase
          .from("payment_proofs")
          .select("id, status")
          .eq("house_id", houseId)
          .eq("period_month", parameters.current_month)
          .eq("period_year", parameters.current_year)
          .in("status", ["pending", "rejected"])
          .single()

        if (existingProof) {
          // Update existing proof instead of creating new one
          const { error: updateError } = await supabase
            .from("payment_proofs")
            .update({
              receipt_url: publicUrl,
              status: 'pending', // Reset to pending if it was rejected
              uploaded_by: user?.id,
              fixed_amount: fixedIncome?.amount || parameters.fixed_income_amount || 0,
              variable_amount: variableIncome?.amount || parameters.variable_income_amount || 0,
              fixed_income_id: fixedIncome?.id || null,
              variable_income_id: variableIncome?.id || null,
            })
            .eq("id", existingProof.id)

          if (updateError) {
            console.error("[v0] Update proof error:", updateError)
            alert("Error al actualizar el comprobante: " + updateError.message)
            setLoading(false)
            return
          }
        } else {
          // Create new proof (no existing pending/rejected proof found)
          const { error: receiptError } = await supabase
            .from("payment_proofs")
            .insert({
              condo_id: condoId,
              house_id: houseId,
              uploaded_by: user?.id,
              period_month: parameters.current_month,
              period_year: parameters.current_year,
              fixed_amount: fixedIncome?.amount || parameters.fixed_income_amount || 0,
              variable_amount: variableIncome?.amount || parameters.variable_income_amount || 0,
              receipt_url: publicUrl,
              status: 'pending',
              fixed_income_id: fixedIncome?.id || null,
              variable_income_id: variableIncome?.id || null,
            })

          if (receiptError) {
            console.error("[v0] Receipt error:", receiptError)
            alert("Error al guardar el comprobante: " + receiptError.message)
            setLoading(false)
            return
          }
        }
      } else {
        console.error("[v0] No income found for this house this month")
        alert("No hay cargos registrados para este mes. Contacte al administrador.")
        setLoading(false)
        return
      }

      setOpen(false)
      setFile(null)
      router.refresh()
    } catch (err) {
      console.error("[v0] Error:", err)
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Subir Comprobante
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">Subir Comprobante de Pago</DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Sube una foto o captura del comprobante de transferencia, depósito o cheque
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receipt" className="text-slate-900 dark:text-slate-200">Archivo (Imagen o PDF) *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="receipt"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                disabled={loading}
                className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Formatos: JPG, PNG, PDF | Máximo 10MB
            </p>
          </div>

          {file && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Archivo seleccionado: {file.name}</p>
              <p className="text-xs text-blue-700 dark:text-blue-400">Tamaño: {(file.size / 1024).toFixed(2)} KB</p>
            </div>
          )}

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={!file || loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Subir Comprobante
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
