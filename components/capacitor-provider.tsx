'use client'

import { useCapacitorInit } from '@/lib/capacitor-init'

export function CapacitorProvider({ children }: { children: React.ReactNode }) {
  useCapacitorInit()

  return <>{children}</>
}
