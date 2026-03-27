"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, Trash2, Building2 } from "lucide-react"

interface CondoLogoUploaderProps {
  condoId: string
  currentLogoUrl: string | null
}

export function CondoLogoUploader({ condoId, currentLogoUrl }: CondoLogoUploaderProps) {
  const [loading, setLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Upload to storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${condoId}-${Date.now()}.${fileExt}`
      const filePath = `condo-logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath)

      // Update condominium
      const { error: updateError } = await supabase
        .from("condominiums")
        .update({ logo_url: publicUrl })
        .eq("id", condoId)

      if (updateError) throw updateError

      setLogoUrl(publicUrl)
      router.refresh()
    } catch (err: any) {
      console.error("Error uploading logo:", err)
      setError(err.message || "Error al subir el logo")
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  async function handleRemoveLogo() {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Update condominium to remove logo
      const { error: updateError } = await supabase
        .from("condominiums")
        .update({ logo_url: null })
        .eq("id", condoId)

      if (updateError) throw updateError

      setLogoUrl(null)
      router.refresh()
    } catch (err: any) {
      console.error("Error removing logo:", err)
      setError(err.message || "Error al eliminar el logo")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Logo del Condominio</h2>
        <p className="text-sm text-muted-foreground">
          Sube el logo de tu condominio para personalizarlo
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-6">
        {logoUrl ? (
          <div className="relative">
            <Image
              src={logoUrl}
              alt="Logo del condominio"
              width={120}
              height={120}
              className="h-28 w-28 rounded-lg object-contain border bg-white p-2"
            />
          </div>
        ) : (
          <div className="h-28 w-28 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
            <Building2 className="h-10 w-10 text-muted-foreground" />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {logoUrl ? "Cambiar Logo" : "Subir Logo"}
          </Button>

          {logoUrl && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemoveLogo}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            Formatos: PNG, JPG, GIF. Max 2MB
          </p>
        </div>
      </div>
    </div>
  )
}
