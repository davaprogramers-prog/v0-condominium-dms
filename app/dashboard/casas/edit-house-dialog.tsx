"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { updateHouse } from "./actions"

interface EditHouseDialogProps {
  houseId: string
  ownerName: string
  ownerEmail: string
  ownerPhone?: string
}

export function EditHouseDialog({ houseId, ownerName, ownerEmail, ownerPhone }: EditHouseDialogProps) {
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

      await updateHouse(houseId, {
        ownerName: (formData.get("owner_name") as string) || "",
        ownerEmail: (formData.get("owner_email") as string) || "",
        ownerPhone: (formData.get("owner_phone") as string) || "",
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
        <Button size="sm" variant="outline">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Casa</DialogTitle>
          <DialogDescription>Actualiza los datos del propietario (no puedes cambiar el número de casa)</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="owner_name">Nombre del Propietario</Label>
            <Input
              id="owner_name"
              name="owner_name"
              placeholder="Nombre completo"
              defaultValue={ownerName}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner_email">Email del Propietario</Label>
            <Input
              id="owner_email"
              name="owner_email"
              type="email"
              placeholder="correo@ejemplo.com"
              defaultValue={ownerEmail}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner_phone">Teléfono del Propietario</Label>
            <Input
              id="owner_phone"
              name="owner_phone"
              placeholder="+56912345678"
              defaultValue={ownerPhone || ""}
            />
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
