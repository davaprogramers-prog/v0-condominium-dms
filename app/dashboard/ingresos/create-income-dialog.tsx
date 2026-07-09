"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2, Upload, X, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"
import { createCondoIncome } from "./actions"
import { useTheme } from "@/app/dashboard/theme-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CreateIncomeDialogProps {
  condoId: string
  houses: any[]
}

export function CreateIncomeDialog({ condoId, houses }: CreateIncomeDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [incomeType, setIncomeType] = useState<"fixed" | "variable">("fixed")
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
    setPreviewUrl("")
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

      const incomeDate = formData.get("incomeDate") as string
      if (!incomeDate) {
        setError("Debes seleccionar una fecha para el ingreso")
        setLoading(false)
        return
      }

      const houseId = formData.get("houseId") as string
      await createCondoIncome(condoId, {
        houseId: houseId && houseId !== "none" ? houseId : undefined,
        amount,
        incomeType,
        incomeDate,
        description: (formData.get("description") as string) || undefined,
        receiptUrl: previewUrl || undefined,
      })

      setOpen(false)
      clearFile()
      setIncomeType("fixed")
      router.refresh()
    } catch (err) {
      console.error("[v0] Error in income form:", err)
      setError(err instanceof Error ? err.message : "Error al crear el ingreso")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
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
          <DollarSign className="h-5 w-5" />
          Agregar Ingreso
        </Button>
      </DialogTrigger>
      <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }} className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle style={{ color: dialogTextColor }}>Registrar Nuevo Ingreso</DialogTitle>
          <DialogDescription style={{ color: dialogTextColor, opacity: 0.7 }}>Agrega ingresos por cuotas o ingresos variables con comprobante</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-2 space-y-4">
            {error && (
              <div style={{ backgroundColor: "#ef4444", color: "white", borderColor: "white" }} className="p-3 rounded-lg text-sm border-l-4">
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
                  placeholder="0.00"
                  required
                  style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="incomeType" style={{ color: dialogTextColor }}>Tipo*</Label>
                <Select value={incomeType} onValueChange={(val) => setIncomeType(val as "fixed" | "variable")}>
                  <SelectTrigger style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}>
                    <SelectItem value="fixed">Ingreso</SelectItem>
                    <SelectItem value="variable">Ingreso Variable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="houseId" style={{ color: dialogTextColor }}>Casa (Opcional)</Label>
                <Select name="houseId" defaultValue="none">
                  <SelectTrigger style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}>
                    <SelectValue placeholder="Seleccionar casa..." />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {houses.map((house) => (
                      <SelectItem key={house.id} value={house.id}>
                        Casa #{house.house_number} - {house.owner_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="incomeDate" style={{ color: dialogTextColor }}>Fecha del Ingreso *</Label>
                <Input
                  id="incomeDate"
                  name="incomeDate"
                  type="date"
                  required
                  placeholder="Selecciona la fecha del ingreso"
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
                    <p className="text-sm" style={{ color: inputTextColor, opacity: 0.7 }}>{selectedFile?.name}</p>
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
          </div>

          <div className="border-t mt-4 pt-4" style={{ borderColor: inputTextColor }}>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Registrar Ingreso
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
