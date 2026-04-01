"use client"

import { Building2 } from "lucide-react"
import { useState, useEffect } from "react"

export function CompanyLogo() {
  const [logoUrl, setLogoUrl] = useState<string>('/company-logo.png')
  const [hasError, setHasError] = useState(false)

  return (
    <img 
      src={logoUrl} 
      alt="DMS INNOVA SPA Logo" 
      className="h-16 w-auto object-contain"
      onError={() => setHasError(true)}
    />
  )
}
