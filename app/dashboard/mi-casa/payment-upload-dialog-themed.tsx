"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface PaymentUploadDialogThemedWrapperProps {
  condoId: string
  houseId: string
  currencySymbol?: string
}

export function PaymentUploadDialogThemedWrapper({ condoId, houseId, currencySymbol }: PaymentUploadDialogThemedWrapperProps) {
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
      const fileName = `${houseId}/${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, file)

      if (uploadError) {
        console.error("[v0] Upload error:", uploadError)
        alert("Error al subir archivo: " + uploadError.message)
        setLoading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from("receipts")
        .getPublicUrl(fileName)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert("Error: Usuario no autenticado")
        setLoading(false)
        return
      }

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

      const { data: incomes } = await supabase
        .from("condo_income")
        .select("id, income_type, amount")
        .eq("house_id", houseId)
        .eq("condo_id", condoId)
        .eq("period_month", parameters.current_month)
        .eq("period_year", parameters.current_year)

      if (incomes && incomes.length > 0) {
        const fixedIncome = incomes.find(i => i.income_type === 'fixed')
        const variableIncome = incomes.find(i => i.income_type === 'variable')

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

        // Create payment proof record(s)
        const paymentProofData: any = {
          house_id: houseId,
          condo_id: condoId,
          period_month: parameters.current_month,
          period_year: parameters.current_year,
          receipt_url: publicUrl,
          status: "pending",
          uploaded_by: user.id,
        }

        if (fixedIncome) {
          paymentProofData.fixed_income_id = fixedIncome.id
        }
        if (variableIncome) {
          paymentProofData.variable_income_id = variableIncome.id
        }

        const { error: insertError } = await supabase
          .from("payment_proofs")
          .insert(paymentProofData)

        if (insertError) {
          console.error("[v0] Insert error:", insertError)
          alert("Error al guardar el comprobante: " + insertError.message)
          setLoading(false)
          return
        }

        setOpen(false)
        setFile(null)
        router.refresh()
      }
    } catch (err) {
      console.error("[v0] Error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          style={{
            backgroundColor: "#2563eb",
            color: "white",
            padding: "12px 24px",
            fontSize: "16px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            border: "2px solid #1d4ed8",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          <Upload className="h-5 w-5" />
          Subir Comprobante
        </button>
      </DialogTrigger>
      <DialogContent
        className="border-2"
        style={{
          backgroundColor: "#1e293b",
          color: "#f1f5f9",
          borderColor: "#0f172a"
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: "#f1f5f9" }}>Subir Comprobante de Pago</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p style={{ color: "#cbd5e1", fontSize: "14px" }}>
            Sube una foto o captura del comprobante de transferencia, depósito o cheque
          </p>
          
          <div className="flex flex-col gap-2">
            <Label htmlFor="file-upload" style={{ color: "#f1f5f9" }}>
              Archivo (Imagen o PDF)
            </Label>
            <div
              style={{
                border: "2px dashed #2563eb",
                borderRadius: "8px",
                padding: "20px",
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: "#0f172a"
              }}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{ display: "none" }}
              />
              <Upload className="h-8 w-8 mx-auto mb-2" style={{ color: "#2563eb" }} />
              <p style={{ color: "#cbd5e1", fontSize: "14px" }}>
                {file ? file.name : "Haz clic para seleccionar archivo"}
              </p>
              <p style={{ color: "#64748b", fontSize: "12px", marginTop: "8px" }}>
                JPG, PNG, PDF | Máximo 10MB
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={!file || loading}
            style={{
              backgroundColor: file && !loading ? "#2563eb" : "#64748b",
              color: "white",
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              cursor: file && !loading ? "pointer" : "not-allowed",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Subiendo..." : "Subir Comprobante"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
