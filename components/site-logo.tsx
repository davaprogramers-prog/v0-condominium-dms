"use client"

import Image from "next/image"
import { Building2 } from "lucide-react"
import { useState } from "react"

export function SiteLogo() {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
        <Building2 className="h-5 w-5 text-primary-foreground" />
      </div>
    )
  }

  return (
    <Image 
      src="/logo.png" 
      alt="InteliCon Logo" 
      width={36} 
      height={36} 
      className="h-9 w-9 rounded-lg object-contain"
      onError={() => setHasError(true)}
    />
  )
}
