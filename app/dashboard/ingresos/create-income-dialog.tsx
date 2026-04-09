"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2, Upload, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { createCondoIncome } from "./actions"
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
  const [incomeType, setIncomeType] = useState<"cuota" | "variable">("cuota")
  const router = useRouter()

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

      const houseId = formData.get("houseId") as string
      await createCondoIncome(condoId, {
        houseId: houseId && houseId !== "none" ? houseId : undefined,
        amount,
        incomeType,
        incomeDate: (formData.get("incomeDate") as string) || new Date().toISOString().split("T")[0],
        description: (formData.get("description") as string) || undefined,
        receiptUrl: previewUrl || undefined,
      })

      setOpen(false)
      clearFile()
      setIncomeType("cuota")
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
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Ingreso
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">Registrar Nuevo Ingreso</DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">Agrega ingresos por cuotas o ingresos variables con comprobante</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-slate-900 dark:text-slate-200">Monto (CLP) *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="incomeType" className="text-slate-900 dark:text-slate-200">Tipo de Ingreso *</Label>
              <Select value={incomeType} onValueChange={(val) => setIncomeType(val as "cuota" | "variable")}>
                <SelectTrigger className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-800 dark:text-white">
                  <SelectItem value="cuota">Cuota Común</SelectItem>
                  <SelectItem value="variable">Ingreso Variable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="houseId" className="text-slate-900 dark:text-slate-200">Casa (Opcional)</Label>
              <Select name="houseId" defaultValue="none">
                <SelectTrigger className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                  <SelectValue placeholder="Seleccionar casa..." />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-800 dark:text-white">
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
              <Label htmlFor="incomeDate" className="text-slate-900 dark:text-slate-200">Fecha del Ingreso</Label>
              <Input
                id="incomeDate"
                name="incomeDate"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-900 dark:text-slate-200">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Detalles adicionales del ingreso..."
              rows={3}
              className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Receipt Upload */}
          <div className="space-y-2">
            <Label className="text-slate-900 dark:text-slate-200">Comprobante (Transferencia/Depósito)</Label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center bg-slate-50 dark:bg-slate-900">
              {previewUrl ? (
                <div className="space-y-2">
                  <div className="relative inline-block">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-40 max-w-full rounded border-2 border-slate-300 dark:border-slate-600"
                    />
                    <button
                      type="button"
                      onClick={clearFile}
                      className="absolute top-1 right-1 bg-destructive rounded-full p-1"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{selectedFile?.name}</p>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6 text-slate-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
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
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Formatos: JPG, PNG. Máx 5MB
            </p>
          </div>

          <Button type="submit" className="w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Registrar Ingreso
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
