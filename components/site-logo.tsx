"use client"

import { Building2 } from "lucide-react"
import { useState, useEffect } from "react"

export function SiteLogo() {
  const [logoUrl, setLogoUrl] = useState<string>('/logo.png')
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Intentar obtener logo desde BD, sino usar el archivo estático
    const fetchLogo = async () => {
      try {
        const response = await fetch('/api/logos/default')
        if (response.ok) {
          const data = await response.json()
          if (data.blob_url) {
            setLogoUrl(data.blob_url)
          }
        }
      } catch (error) {
        console.log('[v0] Logo from DB not available, using default')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogo()
  }, [])

  if (hasError || !logoUrl) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-blue-600">
        <Building2 className="h-8 w-8 text-white" />
      </div>
    )
  }

  return (
    <img 
      src={logoUrl} 
      alt="InteliCon Logo" 
      className="h-20 w-auto object-contain"
      onError={() => setHasError(true)}
    />
  )
}
