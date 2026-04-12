"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2, House } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "@/app/dashboard/theme-context"
import { createHouse } from "./actions"

export function CreateHouseDialog({ condoId }: { condoId: string }) {
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
      const houseNumber = parseInt(formData.get("house_number") as string)

      if (!houseNumber || houseNumber < 1) {
        setError("El número de casa debe ser válido")
        setLoading(false)
        return
      }

      await createHouse(condoId, {
        houseNumber,
        ownerName: (formData.get("owner_name") as string) || "",
        ownerEmail: (formData.get("owner_email") as string) || "",
        ownerPhone: (formData.get("owner_phone") as string) || "",
        paymentDueDay: parseInt(formData.get("payment_due_day") as string) || 5,
      })

      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error("[v0] Error in form:", err)
      setError(err instanceof Error ? err.message : "Error al crear la casa")
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
          <House className="h-5 w-5" />
          Nueva Casa
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
          <DialogTitle style={{ color: dialogTextColor }}>Crear Nueva Casa</DialogTitle>
          <DialogDescription style={{ color: dialogTextColor, opacity: 0.7 }}>Agrega una nueva propiedad al condominio</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="house_number" style={{ color: dialogTextColor }}>Número de Casa *</Label>
            <Input id="house_number" name="house_number" type="number" min={1} required placeholder="Ej: 101" style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner_name" style={{ color: dialogTextColor }}>Nombre del Propietario</Label>
            <Input id="owner_name" name="owner_name" placeholder="Nombre completo" style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner_email" style={{ color: dialogTextColor }}>Email del Propietario *</Label>
            <Input id="owner_email" name="owner_email" type="email" placeholder="correo@ejemplo.com" required style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner_phone" style={{ color: dialogTextColor }}>Teléfono del Propietario</Label>
            <Input id="owner_phone" name="owner_phone" placeholder="+56912345678" style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
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
              defaultValue={5}
              style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
            />
            <p className="text-xs" style={{ color: dialogTextColor, opacity: 0.6 }}>Día del mes para vencimiento del pago (1-28). Por defecto: día 5</p>
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Crear Casa
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

