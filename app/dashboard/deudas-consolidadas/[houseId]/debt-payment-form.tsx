"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface DebtPaymentFormProps {
  houseId: string
  houseName: string
  totalDebt: number
  currencySymbol: string
}

export function DebtPaymentForm({
  houseId,
  houseName,
  totalDebt,
  currencySymbol,
}: DebtPaymentFormProps) {
  const supabase = createClient()
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [amount, setAmount] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

    if (!amount || parseFloat(amount) <= 0) {
      setError("Por favor ingresa un monto válido")
      return
    }

    const paymentAmount = parseFloat(amount)
    if (paymentAmount > totalDebt) {
      setError(`El monto no puede superar la deuda total (${currencySymbol}${totalDebt.toLocaleString()})`)
      return
    }

    setLoading(true)

    try {
      // Upload file to storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${houseId}-${Date.now()}.${fileExt}`
      const filePath = `payment-proofs/${houseId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(filePath, file, { upsert: false })

      if (uploadError) {
        setError("Error al subir el comprobante: " + uploadError.message)
        setLoading(false)
        return
      }

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(filePath)

      // Create payment proof record
      const { error: dbError } = await supabase.from("payment_proofs").insert({
        house_id: houseId,
        amount: paymentAmount,
        file_url: publicUrl.publicUrl,
        status: "pending",
        created_at: new Date().toISOString(),
      })

      if (dbError) {
        setError("Error al guardar el comprobante: " + dbError.message)
        setLoading(false)
        return
      }

      // Success
      setSuccess(true)
      setFile(null)
      setAmount("")

      // Reset after 3 seconds and refresh
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (err) {
      setError("Error al procesar el pago: " + (err as Error).message)
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
          <div>
            <label className="block text-sm font-medium mb-2">Monto a Pagar</label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 bg-muted rounded-lg">{currencySymbol}</span>
              <Input
                type="number"
                placeholder={`Máximo: ${totalDebt.toLocaleString()}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                max={totalDebt}
                step="0.01"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Deuda total: {currencySymbol}
              {totalDebt.toLocaleString()}
            </p>
          </div>

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

          <Button type="submit" className="w-full" disabled={loading || !file || !amount}>
            {loading ? "Enviando..." : "Enviar Comprobante"}
          </Button>
        </>
      )}
    </form>
  )
}
