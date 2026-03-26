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

      // Get current month's income from condo_income
      const { data: parameters } = await supabase
        .from("parameters")
        .select("current_month, current_year")
        .eq("condo_id", condoId)
        .single()

      // Find or get the income record for this house this month
      const { data: income } = await supabase
        .from("condo_income")
        .select("id")
        .eq("house_id", houseId)
        .eq("condo_id", condoId)
        .eq("period_month", parameters?.current_month)
        .eq("period_year", parameters?.current_year)
        .single()

      if (income) {
        const { error: receiptError } = await supabase
          .from("payment_proofs")
          .insert({
            income_id: income.id,
            condo_id: condoId,
            house_id: houseId,
            file_url: publicUrl,
            status: 'pending',
            uploaded_at: new Date().toISOString(),
          })

        if (receiptError) {
          console.error("[v0] Receipt error:", receiptError)
          setLoading(false)
          return
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir Comprobante de Pago</DialogTitle>
          <DialogDescription>
            Sube una foto o captura del comprobante de transferencia, depósito o cheque
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receipt">Archivo (Imagen o PDF) *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="receipt"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos: JPG, PNG, PDF | Máximo 10MB
            </p>
          </div>

          {file && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm font-medium text-blue-900">Archivo seleccionado: {file.name}</p>
              <p className="text-xs text-blue-700">Tamaño: {(file.size / 1024).toFixed(2)} KB</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={!file || loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Subir Comprobante
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
