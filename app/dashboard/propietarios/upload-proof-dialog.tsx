"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Loader2, Image as ImageIcon, X } from "lucide-react"

type PaymentType = "gastos_comunes" | "multas"

interface UploadProofDialogProps {
  houseId: string
  condoId: string
  currentMonth: number
  currentYear: number
  fixedAmount: number
  variableAmount: number
  finesAmount?: number
  currencySymbol: string
  paymentType: PaymentType
  infractions?: any[]
}

export function UploadProofDialog({
  houseId,
  condoId,
  currentMonth,
  currentYear,
  fixedAmount,
  variableAmount,
  finesAmount = 0,
  currencySymbol,
  paymentType,
  infractions = [],
}: UploadProofDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [notes, setNotes] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const totalAmount = paymentType === "gastos_comunes" 
    ? fixedAmount + variableAmount 
    : finesAmount
  
  const dialogTitle = paymentType === "gastos_comunes" 
    ? "Subir Comprobante de Gastos Comunes" 
    : "Subir Comprobante de Multas"
  
  const buttonLabel = paymentType === "gastos_comunes" 
    ? "Subir Comprobante Gastos" 
    : "Subir Comprobante Multas"

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten imagenes (JPG, PNG)")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede ser mayor a 5MB")
      return
    }

    setError(null)
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function clearFile() {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedFile) {
      setError("Debes seleccionar una imagen del comprobante")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      // Upload image to Supabase Storage
      const ext = selectedFile.name.split(".").pop() || "jpg"
      const filePath = `payment-proofs/${condoId}/${houseId}/${Date.now()}.${ext}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, selectedFile, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(uploadData.path)

      // Create payment proof record
      const { error: insertError } = await supabase
        .from("payment_proofs")
        .insert({
          condo_id: condoId,
          house_id: houseId,
          uploaded_by: user.id,
          period_month: currentMonth,
          period_year: currentYear,
          fixed_amount: paymentType === "gastos_comunes" ? fixedAmount : 0,
          variable_amount: paymentType === "gastos_comunes" ? variableAmount : 0,
          fines_amount: paymentType === "multas" ? finesAmount : 0,
          payment_type: paymentType,
          receipt_url: urlData.publicUrl,
          notes: notes || null,
          status: "pending",
        })

      if (insertError) throw insertError

      setOpen(false)
      router.refresh()
    } catch (err: any) {
      console.error("Error uploading proof:", err)
      setError(err.message || "Error al subir el comprobante")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={paymentType === "multas" ? "destructive" : "default"} size="sm">
          <Upload className="h-4 w-4 mr-2" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">{dialogTitle}</DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Sube la imagen del comprobante de transferencia o deposito
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Amount Summary */}
          <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 space-y-2">
            {paymentType === "gastos_comunes" ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Gasto Comun Fijo</span>
                  <span className="font-medium text-slate-900 dark:text-white">{currencySymbol}{fixedAmount.toLocaleString("es-CL")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Gasto Comun Variable</span>
                  <span className="font-medium text-slate-900 dark:text-white">{currencySymbol}{variableAmount.toLocaleString("es-CL")}</span>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">Multas a Pagar:</p>
                {infractions.map((inf: any) => (
                  <div key={inf.id} className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">{inf.description}</span>
                    <span className="font-medium text-red-700 dark:text-red-400">{currencySymbol}{inf.fine_amount?.toLocaleString("es-CL")}</span>
                  </div>
                ))}
              </>
            )}
            <div className="flex justify-between font-medium pt-2 border-t border-slate-300 dark:border-slate-600">
              <span className="text-slate-900 dark:text-white">Total a Pagar</span>
              <span className={paymentType === "multas" ? "text-red-700 dark:text-red-400" : "text-blue-700 dark:text-blue-400"}>
                {currencySymbol}{totalAmount.toLocaleString("es-CL")}
              </span>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label className="text-slate-900 dark:text-slate-200">Imagen del Comprobante *</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border-2 border-slate-300 dark:border-slate-600"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={clearFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-slate-400 dark:border-slate-500 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors bg-slate-50 dark:bg-slate-900"
              >
                <ImageIcon className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Haz clic para seleccionar imagen
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">JPG, PNG. Max 5MB</span>
              </button>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-900 dark:text-slate-200">Notas (opcional)</Label>
            <Textarea
              id="notes"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Transferencia desde Banco Estado"
              rows={2}
              className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading || !selectedFile}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enviar Comprobante
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
