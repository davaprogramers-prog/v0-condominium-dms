"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function CreateHouseDialog({ condoId }: { condoId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const { error } = await supabase.from("houses").insert({
      condo_id: condoId,
      house_number: parseInt(formData.get("house_number") as string),
      owner_name: formData.get("owner_name"),
      owner_email: formData.get("owner_email"),
      owner_phone: formData.get("owner_phone"),
    })

    if (error) {
      console.error("[v0] Error creating house:", error)
      setLoading(false)
      return
    }

    setOpen(false)
    router.refresh()
    setLoading(false)
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
          <div className="space-y-2">
            <Label htmlFor="house_number">Número de Casa *</Label>
            <Input id="house_number" name="house_number" type="number" min={1} required placeholder="Ej: 101" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner_name">Nombre del Propietario</Label>
            <Input id="owner_name" name="owner_name" placeholder="Nombre completo" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner_email">Email del Propietario</Label>
            <Input id="owner_email" name="owner_email" type="email" placeholder="correo@ejemplo.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner_phone">Teléfono del Propietario</Label>
            <Input id="owner_phone" name="owner_phone" placeholder="+56912345678" />
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
