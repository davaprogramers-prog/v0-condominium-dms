"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Camera, Upload, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface AvatarUploadSettingsProps {
  currentAvatarUrl?: string
  userName: string
  cardBgColor?: string
  cardTextColor?: string
}

export function AvatarUploadSettings({ currentAvatarUrl, userName, cardBgColor = "#1e293b", cardTextColor = "#f1f5f9" }: AvatarUploadSettingsProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0] || cameraInputRef.current?.files?.[0]
    if (!file) return

    setLoading(true)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      const fileExt = file.name.split(".").pop()
      const fileName = `avatars/${user.id}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        })

      if (uploadError) throw uploadError
      
      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", user.id)
      
      if (updateError) throw updateError

      setOpen(false)
      setPreviewUrl(null)
      router.refresh()
    } catch (error) {
      console.error("[v0] Avatar upload error:", error)
      alert("Error al subir la imagen. Intente de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const displayName = previewUrl ? "Previsualización" : currentAvatarUrl ? "Avatar Actual" : "Sin Avatar"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            color: cardTextColor,
            borderColor: "rgba(255,255,255,0.2)",
            borderRadius: "8px"
          }}
        >
          <Camera className="h-4 w-4 mr-2" />
          Cambiar Foto
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-md"
        style={{
          backgroundColor: cardBgColor,
          color: cardTextColor,
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.1)"
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: cardTextColor }}>Cambiar foto de perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div
            className="w-full h-48 rounded-lg border-2 border-dashed flex items-center justify-center"
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              borderColor: "rgba(255,255,255,0.2)",
              color: cardTextColor
            }}
          >
            {previewUrl || currentAvatarUrl ? (
              <img
                src={previewUrl || currentAvatarUrl}
                alt="Preview"
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto mb-2" style={{ color: cardTextColor, opacity: 0.5 }} />
                <p style={{ color: cardTextColor, opacity: 0.7 }}>Sin imagen</p>
              </div>
            )}
          </div>

          {/* Upload Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={loading}
              style={{
                backgroundColor: "#2563eb",
                color: "white",
                borderRadius: "8px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1
              }}
            >
              <Camera className="h-4 w-4 mr-2" />
              Cámara
            </Button>
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              style={{
                backgroundColor: "#2563eb",
                color: "white",
                borderRadius: "8px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Galería
            </Button>
          </div>

          {/* Hidden Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Info */}
          <p style={{ fontSize: "12px", color: cardTextColor, opacity: 0.6 }}>
            Formatos: JPG, PNG, WebP | Máximo 5MB
          </p>

          {/* Submit Button */}
          <Button
            onClick={handleUpload}
            disabled={loading || (!previewUrl && !currentAvatarUrl)}
            style={{
              backgroundColor: previewUrl ? "#2563eb" : "rgba(255,255,255,0.1)",
              color: cardTextColor,
              width: "100%",
              borderRadius: "8px",
              border: "none",
              cursor: (loading || !previewUrl) ? "not-allowed" : "pointer",
              opacity: (loading || !previewUrl) ? 0.5 : 1
            }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              "Guardar Foto"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0] || cameraInputRef.current?.files?.[0]
    if (!file) return

    setLoading(true)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      const fileExt = file.name.split(".").pop()
      const fileName = `avatars/${user.id}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        })

      if (uploadError) throw uploadError
      
      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", user.id)
      
      if (updateError) throw updateError

      setOpen(false)
      setPreviewUrl(null)
      router.refresh()
    } catch (error) {
      console.error("[v0] Avatar upload error:", error)
      alert("Error al subir la imagen. Intente de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="group relative w-24 h-24">
          {currentAvatarUrl ? (
            <img
              src={currentAvatarUrl}
              alt={userName}
              className="h-24 w-24 rounded-full object-cover border-2 border-muted"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
              {initials}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-6 w-6 text-white" />
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar foto de perfil</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-32 w-32 rounded-full object-cover border-2 border-muted"
              />
            ) : currentAvatarUrl ? (
              <img
                src={currentAvatarUrl}
                alt={userName}
                className="h-32 w-32 rounded-full object-cover border-2 border-muted"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary text-3xl font-semibold text-primary-foreground">
                {initials}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
              disabled={loading}
            >
              <Camera className="mr-2 h-4 w-4" />
              Tomar foto
            </Button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleFileSelect}
            />

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <Upload className="mr-2 h-4 w-4" />
              Subir imagen
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Formatos: JPG, PNG, WebP | Máximo 5MB
          </p>

          {previewUrl && (
            <Button onClick={handleUpload} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                "Guardar foto"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
