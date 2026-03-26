"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Loader2, Image as ImageIcon, X } from "lucide-react"

interface UploadProofDialogProps {
  houseId: string
  condoId: string
  currentMonth: number
  currentYear: number
  fixedAmount: number
  variableAmount: number
  currencySymbol: string
}

export function UploadProofDialog({
  houseId,
  condoId,
  currentMonth,
  currentYear,
  fixedAmount,
  variableAmount,
  currencySymbol,
}: UploadProofDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const totalAmount = fixedAmount + variableAmount

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

      const formData = new FormData(e.currentTarget)

      // Create payment proof record
      const { error: insertError } = await supabase
        .from("payment_proofs")
        .insert({
          condo_id: condoId,
          house_id: houseId,
          uploaded_by: user.id,
          period_month: currentMonth,
          period_year: currentYear,
          fixed_amount: fixedAmount,
          variable_amount: variableAmount,
          receipt_url: urlData.publicUrl,
          notes: formData.get("notes") as string || null,
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
        <Button variant="default" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Subir Comprobante
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Subir Comprobante de Pago</DialogTitle>
          <DialogDescription>
            Sube la imagen del comprobante de transferencia o deposito
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

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
              <span>Total a Pagar</span>
              <span className="text-primary">{currencySymbol}{totalAmount.toLocaleString("es-CL")}</span>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Imagen del Comprobante *</Label>
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
                  className="w-full h-48 object-cover rounded-lg border"
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
                className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
              >
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Haz clic para seleccionar imagen
                </span>
                <span className="text-xs text-muted-foreground">JPG, PNG. Max 5MB</span>
              </button>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Ej: Transferencia desde Banco Estado"
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || !selectedFile}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enviar Comprobante
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
