'use client'

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export function SearchParamsHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // If there's a code parameter, redirect to auth callback
    const code = searchParams.get("code")
    if (code) {
      router.replace(`/auth/callback?code=${code}&type=recovery`)
    }
  }, [searchParams, router])

  return null
}
