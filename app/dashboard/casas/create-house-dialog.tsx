"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createHouse } from "./actions"

export function CreateHouseDialog({ condoId }: { condoId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

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
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Casa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nueva Casa</DialogTitle>
          <DialogDescription>Agrega una nueva propiedad al condominio</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="house_number">Número de Casa *</Label>
            <Input id="house_number" name="house_number" type="number" min={1} required placeholder="Ej: 101" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner_name">Nombre del Propietario</Label>
            <Input id="owner_name" name="owner_name" placeholder="Nombre completo" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner_email">Email del Propietario *</Label>
            <Input id="owner_email" name="owner_email" type="email" placeholder="correo@ejemplo.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner_phone">Teléfono del Propietario</Label>
            <Input id="owner_phone" name="owner_phone" placeholder="+56912345678" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_due_day">Día de Vencimiento de Pago</Label>
            <Input 
              id="payment_due_day" 
              name="payment_due_day" 
              type="number" 
              min={1} 
              max={28} 
              placeholder="5" 
              defaultValue={5}
            />
            <p className="text-xs text-muted-foreground">Día del mes para vencimiento del pago (1-28). Por defecto: día 5</p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Crear Casa
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

