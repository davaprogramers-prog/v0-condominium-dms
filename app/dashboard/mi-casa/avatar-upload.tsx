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
import { resizeImageIfNeeded } from "@/lib/image-utils"
import { useTheme } from "@/app/dashboard/theme-context"

interface AvatarUploadProps {
  currentAvatarUrl?: string
  userName: string
}

export function AvatarUpload({ currentAvatarUrl, userName }: AvatarUploadProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { theme } = useTheme()

  // Theme colors
  const dialogBgColor = theme?.dialogBgColor || "#ffffff"
  const dialogTextColor = theme?.dialogTextColor || "#000000"
  const inputBgColor = theme?.inputBgColor || "#f5f5f5"
  const inputTextColor = theme?.inputTextColor || "#000000"

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        // Redimensiona la imagen si es necesario (máximo 600x600)
        const resizedFile = await resizeImageIfNeeded(file, 600, 600)
        setSelectedFile(resizedFile)
        
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(resizedFile)
      } catch (error) {
        console.error("[v0] Error processing image:", error)
        alert("Error al procesar la imagen: " + String(error))
      }
    }
  }

  const handleUpload = async () => {
    const file = selectedFile || fileInputRef.current?.files?.[0] || cameraInputRef.current?.files?.[0]
    if (!file) return

    setLoading(true)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      // Upload via API route
      const formData = new FormData()
      formData.append("file", file)
      if (currentAvatarUrl) {
        formData.append("oldUrl", currentAvatarUrl)
      }

      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al subir la imagen")
      }

      const { url } = await response.json()

      // Update profile with Blob URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id)
      
      if (updateError) {
        console.error("[v0] Profile update error:", updateError)
        throw updateError
      }

      setOpen(false)
      setPreviewUrl(null)
      setSelectedFile(null)
      router.refresh()
    } catch (error) {
      console.error("[v0] Avatar upload error:", error)
      alert("Error al subir la imagen: " + String(error))
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
        <button className="group relative">
          {currentAvatarUrl ? (
            <img
              src={currentAvatarUrl}
              alt={userName}
              className="h-16 w-16 rounded-full object-cover border-2 border-muted"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-lg font-semibold text-white">
              {initials}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-5 w-5 text-white" />
          </div>
        </button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-md" 
        style={{ backgroundColor: dialogBgColor, color: dialogTextColor }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: dialogTextColor }}>Cambiar foto de perfil</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {/* Preview */}
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
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-blue-600 text-3xl font-semibold text-white">
                {initials}
              </div>
            )}
          </div>

          {/* Upload options */}
          <div className="flex gap-2">
            {/* Camera option (mobile) */}
            <Button
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
              disabled={loading}
              style={{ 
                backgroundColor: inputBgColor, 
                color: inputTextColor,
                borderColor: dialogTextColor + "40"
              }}
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

            {/* File upload option */}
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              style={{ 
                backgroundColor: inputBgColor, 
                color: inputTextColor,
                borderColor: dialogTextColor + "40"
              }}
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

          <p className="text-xs" style={{ color: dialogTextColor, opacity: 0.7 }}>
            Formatos: JPG, PNG, WebP | Máximo 5MB
          </p>

          {/* Confirm button */}
          {previewUrl && (
            <Button 
              onClick={handleUpload} 
              disabled={loading} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
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
