"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "@/app/dashboard/theme-context"
import { updateHouse } from "./actions"

interface EditHouseDialogProps {
  houseId: string
  houseNumber: string | number
  ownerName: string
  ownerEmail: string
  paymentDueDay?: number
}

export function EditHouseDialog({ houseId, houseNumber, ownerName, ownerEmail, paymentDueDay = 5 }: EditHouseDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { dialogBgColor, dialogTextColor, inputBgColor, inputTextColor } = useTheme()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)

      await updateHouse(houseId, {
        ownerName: (formData.get("owner_name") as string) || "",
        ownerEmail: (formData.get("owner_email") as string) || "",
        paymentDueDay: parseInt(formData.get("payment_due_day") as string) || 5,
      })

      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error("[v0] Error in edit form:", err)
      setError(err instanceof Error ? err.message : "Error al editar la casa")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-white hover:bg-slate-100 text-slate-900 border border-slate-300">
          <Edit2 className="h-4 w-4" style={{ color: "#64748b" }} />
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="border-2"
        style={{
          backgroundColor: dialogBgColor,
          color: dialogTextColor,
          borderColor: dialogBgColor
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: dialogTextColor }}>Editar Casa #{houseNumber}</DialogTitle>
          <DialogDescription style={{ color: dialogTextColor, opacity: 0.7 }}>Actualiza los datos del residente (no puedes cambiar el número de casa)</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="owner_name" style={{ color: dialogTextColor }}>Nombre del Residente</Label>
            <Input
              id="owner_name"
              name="owner_name"
              placeholder="Nombre completo"
              defaultValue={ownerName}
              style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner_email" style={{ color: dialogTextColor }}>Email del Residente</Label>
            <Input
              id="owner_email"
              name="owner_email"
              type="email"
              placeholder="correo@ejemplo.com"
              defaultValue={ownerEmail}
              required
              style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_due_day" style={{ color: dialogTextColor }}>Día de Vencimiento de Pago</Label>
            <Input 
              id="payment_due_day" 
              name="payment_due_day" 
              type="number" 
              min={1} 
              max={28} 
              placeholder="5" 
              defaultValue={paymentDueDay}
              style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
            />
            <p className="text-xs" style={{ color: dialogTextColor, opacity: 0.6 }}>Día del mes para vencimiento del pago (1-28)</p>
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
