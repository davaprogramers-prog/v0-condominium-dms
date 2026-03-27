"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2, Upload, X } from "lucide-react"

export function CreateCondoDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function removeLogo() {
    setLogoFile(null)
    setLogoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

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
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      let logoUrl: string | null = null

      // Upload logo if exists
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `condo-logos/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, logoFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from("documents")
          .getPublicUrl(filePath)

        logoUrl = publicUrl
      }
      
      // Create condominium
      const { data: condo, error: condoError } = await supabase
        .from("condominiums")
        .insert({
          name,
          address,
          currency_symbol: currencySymbol,
          created_by: user.id,
          logo_url: logoUrl,
        })
        .select()
        .single()

      if (condoError) throw condoError

      setOpen(false)
      setLogoFile(null)
      setLogoPreview(null)
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

          <div className="space-y-2">
            <Label>Logo del Condominio</Label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative">
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-lg object-contain border"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="h-20 w-20 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                >
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                Haz clic para subir el logo (opcional)
              </p>
            </div>
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
