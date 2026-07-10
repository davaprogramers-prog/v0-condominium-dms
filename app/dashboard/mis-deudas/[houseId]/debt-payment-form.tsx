"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface DebtPaymentFormProps {
  houseId: string
  houseNumber: string
  totalDebt: number
  currencySymbol: string
}

export function DebtPaymentForm({ houseId, houseNumber, totalDebt, currencySymbol }: DebtPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [amount, setAmount] = useState(totalDebt.toString())
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "application/pdf"]
      if (!validTypes.includes(selectedFile.type)) {
        setError("Por favor sube un archivo en formato JPG, PNG o PDF")
        return
      }
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("El archivo no debe superar 5MB")
        return
      }
      setFile(selectedFile)
      setError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!file) {
      setError("Por favor sube un comprobante de pago")
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Por favor ingresa un monto válido")
      return
    }

    setIsLoading(true)

    try {
      // Upload file to Supabase Storage
      const fileName = `${houseId}/${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("payment_proofs")
        .upload(fileName, file)

      if (uploadError) throw new Error(uploadError.message)

      // Create payment proof record
      const { data: proofData, error: proofError } = await supabase
        .from("payment_proofs")
        .insert({
          house_id: houseId,
          amount: parseFloat(amount),
          file_url: uploadData.path,
          status: "pending",
          notes: `Comprobante de pago manual para Casa #${houseNumber}`,
        })
        .select()
        .single()

      if (proofError) throw new Error(proofError.message)

      setSuccess(true)
      setFile(null)
      setAmount(totalDebt.toString())
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSuccess(false)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir el comprobante")
      console.error("[v0] Payment error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Registrar Pago</CardTitle>
        <CardDescription>Sube tu comprobante de pago</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Monto a Pagar</Label>
            <div className="flex gap-2">
              <span className="inline-flex items-center px-3 rounded-l-md border border-input bg-muted text-sm font-medium">
                {currencySymbol}
              </span>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
                className="rounded-l-none"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Total a pagar: {currencySymbol}
              {totalDebt.toLocaleString("es-CL")}
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Comprobante de Pago</Label>
            <div className="relative">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={isLoading}
                className="cursor-pointer"
              />
              <Upload className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            <p className="text-xs text-muted-foreground">
              {file ? file.name : "JPG, PNG o PDF • Máx 5MB"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-900 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 rounded-md bg-green-50 text-green-900 text-sm">
              ✓ Comprobante enviado correctamente. Tu pago será verificado próximamente.
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !file}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Registrar Pago
              </>
            )}
          </Button>

          {/* Info */}
          <div className="p-3 rounded-md bg-blue-50 text-blue-900 text-xs space-y-1">
            <p className="font-medium">¿Cómo funciona?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Sube tu comprobante de pago (transferencia, cheque, etc.)</li>
              <li>Será verificado por la administración</li>
              <li>Recibirás confirmación cuando sea aprobado</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
