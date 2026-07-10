"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Upload, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface DebtItem {
  id: string
  amount: number | null
}

interface DebtPaymentFormProps {
  houseId: string
  condoId: string
  houseName: string
  totalDebt: number
  currencySymbol: string
  selectedDebts: DebtItem[]
  selectedTotal: number
  baseCommonTotal: number
  baseVariableTotal: number
  commonTotal: number
  variableTotal: number
  fixedExemptionPercent: number
  variableExemptionPercent: number
}

export function DebtPaymentForm({
  houseId,
  condoId,
  houseName,
  totalDebt,
  currencySymbol,
  selectedDebts,
  selectedTotal,
  baseCommonTotal,
  baseVariableTotal,
  commonTotal,
  variableTotal,
  fixedExemptionPercent,
  variableExemptionPercent,
}: DebtPaymentFormProps) {
  const supabase = createClient()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const displayAmount = selectedTotal > 0 ? selectedTotal : totalDebt
  const hasSelectedDebts = selectedDebts.length > 0

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0]

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("El archivo no puede superar 5MB")
        setFile(null)
        return
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"]
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Solo se permiten JPG, PNG o PDF")
        setFile(null)
        return
      }

      setFile(selectedFile)
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!file) {
      setError("Por favor selecciona un comprobante")
      return
    }

    if (!hasSelectedDebts) {
      setError("Por favor selecciona al menos una deuda para pagar")
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      // Upload file to receipts storage (same as propietarios)
      const fileExt = file.name.split(".").pop() || "jpg"
      const filePath = `payment-proofs/${houseId}/${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from("receipts")
        .getPublicUrl(uploadData.path)

      // Create payment proof record using BASE amounts (before exemptions)
      // This matches the behavior in propietarios
      const now = new Date()
      
      const { error: insertError } = await supabase
        .from("payment_proofs")
        .insert({
          condo_id: condoId,
          house_id: houseId,
          uploaded_by: user.id,
          fixed_amount: baseCommonTotal,
          variable_amount: baseVariableTotal,
          fines_amount: 0,
          receipt_url: publicUrl.publicUrl,
          status: "pending",
          period_month: now.getMonth() + 1,
          period_year: now.getFullYear(),
          payment_type: "gastos_comunes",
        })

      if (insertError) throw insertError

      // Success
      setSuccess(true)
      setFile(null)

      // Reset after 2 seconds and refresh
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (err: any) {
      console.error("Error:", err)
      setError(err.message || "Error al procesar el pago")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-4">
      {success && (
        <div className="flex gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Comprobante enviado exitosamente</p>
            <p className="text-xs">El administrador revisará tu pago en breve</p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!success && (
        <>
          {!hasSelectedDebts && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
              Selecciona las deudas que quieres pagar en el desglose de arriba
            </div>
          )}
          
          {hasSelectedDebts && (
            <div>
              <label className="block text-sm font-medium mb-2">Monto a Pagar</label>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {currencySymbol}
                  {displayAmount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Basado en las {selectedDebts.length} deuda(s) seleccionada(s)
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Comprobante de Pago</label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                disabled={loading}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                {file ? (
                  <p className="text-sm font-medium text-green-600">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium">Haz clic para seleccionar</p>
                    <p className="text-xs text-muted-foreground">o arrastra un archivo</p>
                  </>
                )}
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG o PDF (máx 5MB)</p>
              </label>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !file || !hasSelectedDebts}>
            {loading ? "Enviando..." : "Enviar Comprobante"}
          </Button>
        </>
      )}
    </form>
  )
}
