'use client'

import { Building2 } from "lucide-react"

export function SiteLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
        <Building2 className="h-6 w-6 text-white" />
      </div>
      <span className="font-bold text-lg">InteliCon</span>
    </div>
  )
}
