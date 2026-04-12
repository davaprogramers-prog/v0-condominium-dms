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
}

export function AvatarUploadSettings({ currentAvatarUrl, userName }: AvatarUploadSettingsProps) {
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
