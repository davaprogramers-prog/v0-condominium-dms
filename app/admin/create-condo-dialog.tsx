"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from "lucide-react"

export function CreateCondoDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const address = formData.get("address") as string
    const currencySymbol = formData.get("currency_symbol") as string || "$"

    try {
      const supabase = createClient()
      
      // Create condominium
      const { data: condo, error: condoError } = await supabase
        .from("condominiums")
        .insert({
          name,
          address,
          currency_symbol: currencySymbol,
        })
        .select()
        .single()

      if (condoError) throw condoError

      setOpen(false)
      router.refresh()
    } catch (err: any) {
      console.error("[v0] Error creating condo:", err)
      setError(err.message || "Error al crear el condominio")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Crear Condominio
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nuevo Condominio</DialogTitle>
          <DialogDescription>
            Ingresa los datos del nuevo condominio. El administrador se puede asignar despues.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Condominio *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ej: Condominio Los Alamos"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Direccion</Label>
            <Textarea
              id="address"
              name="address"
              placeholder="Direccion completa del condominio"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency_symbol">Simbolo de Moneda</Label>
            <Input
              id="currency_symbol"
              name="currency_symbol"
              placeholder="$"
              defaultValue="$"
              maxLength={5}
            />
            <p className="text-xs text-muted-foreground">
              Simbolo usado para mostrar valores monetarios (ej: $, USD, CLP)
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear Condominio
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
