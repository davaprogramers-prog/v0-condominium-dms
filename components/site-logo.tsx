"use client"

import { Building2 } from "lucide-react"
import { useState } from "react"

export function SiteLogo() {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
        <Building2 className="h-6 w-6 text-primary-foreground" />
      </div>
    )
  }

  return (
    <img 
      src="/logo.png" 
      alt="InteliCon Logo" 
      className="h-20 w-auto object-contain"
      onError={() => setHasError(true)}
    />
  )
}
