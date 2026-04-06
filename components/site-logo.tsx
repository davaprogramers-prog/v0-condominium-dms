"use client"

import { Building2 } from "lucide-react"
import { useState } from "react"

export function SiteLogo() {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-blue-600">
        <Building2 className="h-10 w-10 text-white" />
      </div>
    )
  }

  return (
    <img 
      src="/intelicon-logo.png" 
      alt="InteliCon Logo" 
      className="h-20 w-auto object-contain"
      onError={() => setHasError(true)}
    />
  )
}
