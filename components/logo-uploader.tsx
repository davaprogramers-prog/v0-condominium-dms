"use client"

import { useState, useRef } from "react"
import { Building2, Upload } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Image from "next/image"

export function LogoUploader() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const supabase = createClient()

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `logo-${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        console.error("Error uploading logo:", uploadError)
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName)

      // Save to site_settings
      const { error: settingsError } = await supabase
        .from('site_settings')
        .upsert({ 
          id: 'default', 
          logo_url: publicUrl,
          updated_at: new Date().toISOString()
        })

      if (settingsError) {
        console.error("Error saving settings:", settingsError)
        return
      }

      setLogoUrl(publicUrl)
      router.refresh()
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div 
      onClick={handleClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary cursor-pointer hover:opacity-80 transition-opacity relative group"
      title="Haz clic para subir tu logo"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {logoUrl ? (
        <Image 
          src={logoUrl} 
          alt="Logo" 
          width={36} 
          height={36} 
          className="h-9 w-9 rounded-lg object-contain"
        />
      ) : (
        <>
          <Building2 className="h-5 w-5 text-primary-foreground" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <Upload className="h-4 w-4 text-white" />
          </div>
        </>
      )}
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
