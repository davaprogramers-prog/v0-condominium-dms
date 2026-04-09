'use client'

import { Building2 } from "lucide-react"

export function CompanyLogo() {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <Building2 className="h-5 w-5" />
      <span className="text-sm font-medium">Powered by InteliCon</span>
    </div>
  )
}
