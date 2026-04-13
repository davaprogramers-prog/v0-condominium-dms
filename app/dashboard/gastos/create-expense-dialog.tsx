"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2, Upload, X, Settings, Building2, DollarSign, CreditCard, DollarSignIcon, BadgeDollarSign } from "lucide-react"
import { useRouter } from "next/navigation"
import { createCondoExpense } from "./actions"
import { createClient } from "@/lib/supabase/client"
import { useTheme } from "../theme-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ExpenseType {
  id: string
  name: string
  description?: string
}

interface ExpenseLogo {
  id: string
  name: string
  logo_url: string
}

interface CreateExpenseDialogProps {
  condoId: string
  expenseTypes: ExpenseType[]
  isSuperAdmin?: boolean
}

export function CreateExpenseDialog({ condoId, expenseTypes, isSuperAdmin = false }: CreateExpenseDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [expenseLogos, setExpenseLogos] = useState<ExpenseLogo[]>([])
  const [selectedLogoId, setSelectedLogoId] = useState<string>("")
  const router = useRouter()
  const { dialogBgColor, dialogTextColor, inputBgColor, inputTextColor } = useTheme()

  useEffect(() => {
    async function loadLogos() {
      const supabase = createClient()
      const { data } = await supabase
        .from("expense_logos")
        .select("id, name, logo_url")
        .order("name")
      setExpenseLogos(data || [])
    }
    if (open) {
      loadLogos()
    }
  }, [open, condoId])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("La imagen no debe exceder 5MB")
        return
      }
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

      await createCondoExpense(condoId, {
        title: (formData.get("title") as string) || "",
        description: (formData.get("description") as string) || "",
        amount,
        category: (formData.get("category") as string) || "otro",
        expenseDate: (formData.get("expenseDate") as string) || new Date().toISOString().split("T")[0],
        receiptUrl: previewUrl || undefined,
        expenseLogoId: selectedLogoId || undefined,
      })

      setOpen(false)
      clearFile()
      setSelectedLogoId("")
      router.refresh()
    } catch (err) {
      console.error("[v0] Error in expense form:", err)
      setError(err instanceof Error ? err.message : "Error al crear el gasto")
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
          <BadgeDollarSign className="h-5 w-5" />
          Agregar Gasto
        </Button>
      </DialogTrigger>
      <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ color: dialogTextColor }}>Registrar Nuevo Gasto</DialogTitle>
          <DialogDescription style={{ color: dialogTextColor, opacity: 0.7 }}>Agrega un gasto del condominio con la boleta/factura</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title" style={{ color: dialogTextColor }}>Título del Gasto *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Ej: Limpieza áreas comunes"
                required
                style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
              />
            </div>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" style={{ color: dialogTextColor }}>Descripción/Detalles</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Ej: Limpieza febrero - Rusbel"
              rows={2}
              style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" style={{ color: dialogTextColor }}>Tipo de Gasto *</Label>
              {expenseTypes.length > 0 ? (
                <Select name="category" required>
                  <SelectTrigger style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}>
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                  <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                    {expenseTypes.map((type) => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div style={{ backgroundColor: "#1e40af", borderColor: "#1e40af" }} className="text-sm p-3 border rounded-md">
                  <span style={{ color: "#ffffff" }}>No hay tipos definidos. </span>
                  <a href="/dashboard/tipos-gastos" className="text-white hover:text-blue-200 underline font-medium">
                    Crear tipos de gastos
                  </a>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="expenseDate" style={{ color: dialogTextColor }}>Fecha del Gasto</Label>
              <Input
                id="expenseDate"
                name="expenseDate"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
              />
            </div>
          </div>

          {/* Logo Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label style={{ color: dialogTextColor }}>Logo del Proveedor</Label>
              {isSuperAdmin && (
                <Link
                  href="/dashboard/gastos/logos"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Settings className="h-3 w-3" />
                  Gestionar logos
                </Link>
              )}
            </div>
            {expenseLogos.length > 0 ? (
              <Select value={selectedLogoId} onValueChange={setSelectedLogoId}>
                <SelectTrigger style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}>
                  <SelectValue placeholder="Seleccionar logo (opcional)">
                    {selectedLogoId && (
                      <div className="flex items-center gap-2">
                        <Image
                          src={expenseLogos.find(l => l.id === selectedLogoId)?.logo_url || ""}
                          alt=""
                          width={20}
                          height={20}
                          className="h-5 w-5 object-cover rounded-full"
                        />
                        <span>{expenseLogos.find(l => l.id === selectedLogoId)?.name}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      <span>Sin logo</span>
                    </div>
                  </SelectItem>
                  {expenseLogos.map((logo) => (
                    <SelectItem key={logo.id} value={logo.id}>
                      <div className="flex items-center gap-2">
                        <Image
                          src={logo.logo_url}
                          alt={logo.name}
                          width={20}
                          height={20}
                          className="h-5 w-5 object-cover rounded-full"
                        />
                        <span>{logo.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div style={{ backgroundColor: "#1e40af", borderColor: "#1e40af" }} className="text-sm p-3 border rounded-md flex items-center justify-between">
                <span style={{ color: "#ffffff" }}>No hay logos</span>
                <Link href="/dashboard/gastos/logos" className="text-white hover:text-blue-200 underline text-xs font-medium">
                  Agregar logos
                </Link>
              </div>
            )}
          </div>

          {/* Receipt Upload */}
          <div className="space-y-2">
            <Label style={{ color: dialogTextColor }}>Imagen de Boleta/Factura</Label>
            <div style={{ borderColor: inputTextColor, backgroundColor: inputBgColor === "#f8fafc" ? "#f1f5f9" : "#0f172a" }} className="border-2 border-dashed rounded-lg p-4 text-center">
              {previewUrl ? (
                <div className="space-y-2">
                  <div className="relative inline-block">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{ borderColor: inputTextColor }}
                      className="max-h-40 max-w-full rounded border-2"
                    />
                    <button
                      type="button"
                      onClick={clearFile}
                      className="absolute top-1 right-1 bg-destructive rounded-full p-1"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                  <p style={{ color: inputTextColor, opacity: 0.7 }} className="text-sm">{selectedFile?.name}</p>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6" style={{ color: inputTextColor, opacity: 0.5 }} />
                    <span style={{ color: inputTextColor, opacity: 0.7 }} className="text-sm">
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
            <p style={{ color: inputTextColor, opacity: 0.7 }} className="text-xs">
              Formatos: JPG, PNG. Máx 5MB
            </p>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Registrar Gasto
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
