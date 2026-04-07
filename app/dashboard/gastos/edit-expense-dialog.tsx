"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Pencil, X, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { updateExpense } from "./actions"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

interface ExpenseType {
  id: string
  name: string
}

interface EditExpenseDialogProps {
  expense: any
  expenseTypes?: ExpenseType[]
}

export function EditExpenseDialog({ expense, expenseTypes = [] }: EditExpenseDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string>(expense.receipt_url || "")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [expenseLogos, setExpenseLogos] = useState<any[]>([])
  const [selectedLogoId, setSelectedLogoId] = useState<string>(expense.expense_logo_id || "")
  const router = useRouter()

  useEffect(() => {
    async function loadLogos() {
      const supabase = createClient()
      const { data } = await supabase
        .from("expense_logos")
        .select("id, name, logo_url")
        .is("condo_id", null)
        .order("name")
      setExpenseLogos(data || [])
    }
    loadLogos()
  }, [])

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
    setPreviewUrl(expense.receipt_url || "")
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

      await updateExpense(expense.id, {
        title: (formData.get("title") as string) || "",
        description: (formData.get("description") as string) || "",
        amount,
        expenseDate: (formData.get("expenseDate") as string),
        category: (formData.get("category") as string) || "otro",
        expenseLogoId: selectedLogoId || undefined,
        receiptUrl: previewUrl || undefined,
      })

      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error("[v0] Error in edit form:", err)
      setError(err instanceof Error ? err.message : "Error al actualizar el gasto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Gasto</DialogTitle>
          <DialogDescription>Actualiza los detalles del gasto y la boleta/factura</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título del Gasto *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Ej: Reparación puerta"
                defaultValue={expense.title}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Monto (CLP) *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                defaultValue={expense.amount}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Detalles adicionales del gasto..."
              defaultValue={expense.description}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Tipo de Gasto *</Label>
              <Select name="category" defaultValue={expense.category || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {expenseTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                  {/* Fallback for old data */}
                  {!expenseTypes.find(t => t.name === expense.category) && expense.category && (
                    <SelectItem value={expense.category}>
                      {expense.category}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expenseDate">Fecha del Gasto</Label>
              <Input
                id="expenseDate"
                name="expenseDate"
                type="date"
                defaultValue={new Date(expense.expense_date).toISOString().split("T")[0]}
              />
            </div>
          </div>

          {/* Logo Selector */}
          <div className="space-y-2">
            <Label>Logo del Proveedor</Label>
            <Select value={selectedLogoId || "none"} onValueChange={(val) => setSelectedLogoId(val === "none" ? "" : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar logo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin logo</SelectItem>
                {expenseLogos.map((logo) => (
                  <SelectItem key={logo.id} value={logo.id}>
                    {logo.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Receipt Upload */}
          <div className="space-y-2">
            <Label>Imagen de Boleta/Factura</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              {previewUrl ? (
                <div className="space-y-2">
                  <div className="relative inline-block">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-40 max-w-full rounded"
                    />
                    <button
                      type="button"
                      onClick={clearFile}
                      className="absolute top-1 right-1 bg-destructive rounded-full p-1"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                  {selectedFile && <p className="text-sm text-muted-foreground">{selectedFile.name}</p>}
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
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
            <p className="text-xs text-muted-foreground">
              Formatos: JPG, PNG. Máx 5MB
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar Cambios
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
