"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react"
import { useState, useRef } from "react"

interface FileUploadProps {
  bucket: string
  folder?: string
  onUpload: (url: string) => void
  accept?: string
  label?: string
  currentUrl?: string
}

export function FileUpload({ bucket, folder = "", onUpload, accept = "image/*,application/pdf", label = "Subir archivo", currentUrl }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    try {
      const supabase = createClient()
      const ext = file.name.split(".").pop()
      const path = `${folder ? folder + "/" : ""}${Date.now()}.${ext}`
      const { data, error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
      if (uploadError) {
        if (uploadError.message.includes("Bucket not found") || uploadError.message.includes("bucket")) {
          setError(`Bucket "${bucket}" no existe. Contacta al administrador.`)
        } else {
          setError(uploadError.message)
        }
        return
      }
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
      setPreview(urlData.publicUrl)
      setFileName(file.name)
      onUpload(urlData.publicUrl)
    } catch (err: any) {
      console.error("Error uploading:", err)
      setError(err.message || "Error al subir archivo")
    } finally {
      setUploading(false)
    }
  }

  const isImage = preview && (preview.match(/\.(jpg|jpeg|png|gif|webp)/i) || !preview.match(/\.pdf/i))

  return (
    <div className="flex flex-col gap-2">
      <Input ref={inputRef} type="file" accept={accept} onChange={handleUpload} className="hidden" />
      <Button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full justify-start gap-2 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white dark:border-slate-600"
      >
        <Upload className="h-4 w-4" />
        {uploading ? "Subiendo..." : label}
      </Button>
      {error && (
        <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </div>
      )}
      {preview && (
        <div className="relative rounded-lg border border-slate-300 dark:border-slate-600 p-2 bg-slate-100 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => { setPreview(null); setFileName(null); onUpload("") }}
            className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
          >
            <X className="h-3 w-3" />
          </button>
          {isImage ? (
            <img src={preview} alt="Preview" className="h-32 w-full rounded object-cover" />
          ) : (
            <div className="flex items-center gap-2 p-2">
              <FileText className="h-8 w-8 text-slate-600 dark:text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">{fileName || "Archivo subido"}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
