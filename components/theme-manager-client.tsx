'use client'

import { useEffect, useState } from 'react'
import type { CondoTheme } from '@/lib/theme-utils'

interface ThemeManagerClientProps {
  theme: CondoTheme | null
  condoId: string
}

export function ThemeManagerClient({ theme, condoId }: ThemeManagerClientProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    if (!theme?.enable_custom_theme) {
      return
    }

    // Apply theme colors to CSS variables
    const root = document.documentElement
    root.style.setProperty('--condo-sidebar-bg', theme.sidebar_bg_color)
    root.style.setProperty('--condo-sidebar-text', theme.sidebar_text_color)
    root.style.setProperty('--condo-main-bg', theme.main_bg_color)
    root.style.setProperty('--condo-main-text', theme.main_text_color)
    root.style.setProperty('--condo-card-bg', theme.card_bg_color)
    root.style.setProperty('--condo-card-text', theme.card_text_color)
  }, [theme])

  if (!mounted) {
    return null
  }

  return null
}
