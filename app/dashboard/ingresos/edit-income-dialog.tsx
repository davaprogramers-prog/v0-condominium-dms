"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Pencil, X, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { updateIncome } from "./actions"
import { useTheme } from "@/app/dashboard/theme-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface EditIncomeDialogProps {
  income: any
  houses: any[]
}

export function EditIncomeDialog({ income, houses }: EditIncomeDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string>(income.receipt_url || "")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const router = useRouter()
  const { dialogBgColor, dialogTextColor, inputBgColor, inputTextColor } = useTheme()

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function clearFile() {
    setSelectedFile(null)
    setPreviewUrl(income.receipt_url || "")
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const amount = parseFloat(formData.get("amount") as string)

      if (amount <= 0) {
        setError("El monto debe ser mayor a 0")
        setLoading(false)
        return
      }

      await updateIncome(income.id, {
        amount,
        incomeDate: (formData.get("incomeDate") as string),
        description: (formData.get("description") as string) || undefined,
        receiptUrl: previewUrl || undefined,
      })

      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error("[v0] Error in edit income form:", err)
      setError(err instanceof Error ? err.message : "Error al actualizar el ingreso")
    } finally {
      setLoading(false)
    }
  }

  const house = income.house_id ? houses.find((h) => h.id === income.house_id) : null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle style={{ color: dialogTextColor }}>Editar Ingreso</DialogTitle>
          <DialogDescription style={{ color: dialogTextColor, opacity: 0.7 }}>Actualiza los detalles del ingreso y el comprobante</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" style={{ color: dialogTextColor }}>Monto (CLP) *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                defaultValue={income.amount}
                placeholder="0.00"
                required
                style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
              />
            </div>
            <div className="space-y-2">
              <Label style={{ color: dialogTextColor }}>Tipo de Ingreso</Label>
              <Input
                type="text"
                value={income.income_type === "cuota" ? "Cuota Común" : "Ingreso Variable"}
                disabled
                style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label style={{ color: dialogTextColor }}>Casa Asignada</Label>
              <Input
                type="text"
                value={house ? `Casa #${house.house_number}` : "Sin asignar"}
                disabled
                style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="incomeDate" style={{ color: dialogTextColor }}>Fecha del Ingreso</Label>
              <Input
                id="incomeDate"
                name="incomeDate"
                type="date"
                defaultValue={new Date(income.income_date).toISOString().split("T")[0]}
                style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" style={{ color: dialogTextColor }}>Descripción</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Detalles adicionales del ingreso..."
              defaultValue={income.description}
              rows={3}
              style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
            />
          </div>

          {/* Receipt Upload */}
          <div className="space-y-2">
            <Label style={{ color: dialogTextColor }}>Comprobante (Transferencia/Depósito)</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center" style={{ borderColor: inputTextColor, backgroundColor: inputBgColor }}>
              {previewUrl ? (
                <div className="space-y-2">
                  <div className="relative inline-block">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-40 max-w-full rounded"
                      style={{ border: `2px solid ${inputTextColor}` }}
                    />
                    <button
                      type="button"
                      onClick={clearFile}
                      className="absolute top-1 right-1 bg-destructive rounded-full p-1"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                  {selectedFile && <p className="text-sm" style={{ color: inputTextColor, opacity: 0.7 }}>{selectedFile.name}</p>}
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6" style={{ color: inputTextColor, opacity: 0.5 }} />
                    <span className="text-sm" style={{ color: inputTextColor, opacity: 0.7 }}>
                      Haz clic para cargar o arrastra una imagen
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs" style={{ color: inputTextColor, opacity: 0.6 }}>
              Formatos: JPG, PNG. Máx 5MB
            </p>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar Cambios
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
