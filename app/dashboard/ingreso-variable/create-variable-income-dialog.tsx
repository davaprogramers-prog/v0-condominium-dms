"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TrendingUp, Loader2, Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import { createVariableIncome, updateVariableIncome } from "@/app/dashboard/actions"
import { useTheme } from "@/app/dashboard/theme-context"

interface VariableIncomeData {
  id: string
  description: string
  amount: number | string
  income_date: string
  source?: string | null
}

interface CreateVariableIncomeDialogProps {
  condoId: string
  income?: VariableIncomeData
}

// Map Supabase error codes to user-friendly messages
function getErrorMessage(err: any): string {
  if (typeof err === "string") return err
  
  if (err?.code === "42501") {
    return "No tienes permisos para crear ingresos variables. Contacta al administrador del sistema."
  }
  
  if (err?.message?.includes("42501")) {
    return "No tienes permisos para crear ingresos variables. Contacta al administrador del sistema."
  }
  
  if (err?.message) {
    return err.message
  }
  
  return "Error al crear el ingreso variable. Intenta nuevamente."
}

export function CreateVariableIncomeDialog({ condoId, income }: CreateVariableIncomeDialogProps) {
  const [open, setOpen] = useState(false)
  const isEditing = Boolean(income)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [receiptUrl, setReceiptUrl] = useState("")
  const router = useRouter()
  const { dialogBgColor, dialogTextColor, inputBgColor, inputTextColor } = useTheme()

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

      formData.set("receipt_url", receiptUrl)
      if (income) {
        await updateVariableIncome(income.id, formData)
      } else {
        await createVariableIncome(formData)
      }

      setOpen(false)
      setReceiptUrl("")
      router.refresh()
    } catch (err) {
      const friendlyError = getErrorMessage(err)
      setError(friendlyError)
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
          {isEditing ? <Pencil className="h-4 w-4" /> : <TrendingUp className="h-5 w-5" />}
          {isEditing ? "Editar" : "Nuevo Ingreso Variable"}
        </Button>
      </DialogTrigger>
      <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }} className="max-w-lg">
        <DialogHeader>
          <DialogTitle style={{ color: dialogTextColor }}>{isEditing ? "Editar Ingreso Variable" : "Registrar Ingreso Variable"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="description" style={{ color: dialogTextColor }}>Descripción</Label>
            <Input 
              id="description" 
              name="description" 
              placeholder="Descripción del ingreso"
              defaultValue={income?.description || ""}
              required
              style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount" style={{ color: dialogTextColor }}>Monto</Label>
              <Input 
                id="amount" 
                name="amount" 
                type="number" 
                step="0.01" 
                placeholder="0.00"
                defaultValue={income?.amount ?? ""}
                required
                style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="income_date" style={{ color: dialogTextColor }}>Fecha</Label>
              <Input 
                id="income_date" 
                name="income_date" 
                type="date" 
                defaultValue={income?.income_date || new Date().toISOString().split("T")[0]}
                required
                style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="source" style={{ color: dialogTextColor }}>Fuente / Origen</Label>
            <Input 
              id="source" 
              name="source" 
              placeholder="Ej: Arriendo sala, Multa, etc."
              defaultValue={income?.source || ""}
              style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
            />
          </div>
          <input type="hidden" name="receipt_url" value={receiptUrl} />
          {error && (
            <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "#fee2e2", color: "#991b1b", borderColor: "#ef4444", borderWidth: "1px" }}>
              {error}
            </div>
          )}
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Guardar Cambios" : "Guardar Ingreso"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
