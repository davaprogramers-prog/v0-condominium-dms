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
import { put, del } from "@vercel/blob"
import { resizeImageIfNeeded } from "@/lib/image-utils"

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleDeleteAvatar = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar tu foto de perfil?")) return

    const supabase = createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      // Delete from Blob if URL exists
      if (currentAvatarUrl && currentAvatarUrl.includes("blob.vercel-storage.com")) {
        await del(currentAvatarUrl)
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id)
      
      if (updateError) throw updateError
      router.refresh()
    } catch (error) {
      console.error("[v0] Avatar delete error:", error)
      alert("Error al eliminar la imagen. Intente de nuevo.")
    }
  }

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
    if (!file) {
      console.log("[v0] No file selected")
      return
    }

    console.log("[v0] Starting avatar upload, file size:", (file.size / 1024).toFixed(2), "KB, type:", file.type)
    setLoading(true)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      console.log("[v0] User authenticated:", user.id)

      // Upload to Vercel Blob
      console.log("[v0] Uploading to Vercel Blob...")
      const blob = await put(`avatars/${user.id}-${Date.now()}`, file, {
        access: "public",
      })

      console.log("[v0] Blob upload successful:", blob.url)

      // Update profile with Blob URL
      console.log("[v0] Updating profile with blob URL...")
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: blob.url })
        .eq("id", user.id)
      
      if (updateError) throw updateError

      console.log("[v0] Profile updated successfully")
      setOpen(false)
      setPreviewUrl(null)
      setSelectedFile(null)
      router.refresh()
    } catch (error) {
      console.error("[v0] Avatar upload error:", error)
      console.error("[v0] Error details:", JSON.stringify(error, null, 2))
      alert("Error al subir la imagen: " + String(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Avatar Preview */}
      {currentAvatarUrl && (
        <div className="space-y-2">
          <p className="text-sm font-medium" style={{ color: cardTextColor }}>Tu foto actual</p>
          <div
            className="w-32 h-32 rounded-lg overflow-hidden border-2 flex items-center justify-center"
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              borderColor: "rgba(255,255,255,0.2)"
            }}
          >
            <img
              src={currentAvatarUrl}
              alt="Avatar actual"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* No Avatar Message */}
      {!currentAvatarUrl && (
        <div
          className="w-32 h-32 rounded-lg overflow-hidden border-2 border-dashed flex items-center justify-center"
          style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            borderColor: "rgba(255,255,255,0.2)",
            color: cardTextColor
          }}
        >
          <div className="text-center">
            <Camera className="h-8 w-8 mx-auto mb-2" style={{ opacity: 0.5 }} />
            <p className="text-xs" style={{ opacity: 0.7 }}>Sin foto</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 w-full">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              style={{
                backgroundColor: "#2563eb",
                color: "white",
                borderRadius: "8px",
                border: "none",
                flex: "1 1 auto",
                minWidth: "120px",
                cursor: "pointer",
                padding: "8px 16px"
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

      {/* Delete Avatar Button */}
      {currentAvatarUrl && (
        <Button
          onClick={handleDeleteAvatar}
          style={{
            backgroundColor: "#dc2626",
            color: "white",
            borderRadius: "8px",
            border: "none",
            flex: "1 1 auto",
            minWidth: "120px",
            cursor: "pointer",
            padding: "8px 16px"
          }}
        >
          Eliminar Foto
        </Button>
      )}
      </div>
    </div>
  )
}
