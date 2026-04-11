'use client'

import { useEffect } from 'react'
import { type CondoTheme } from '@/lib/theme-utils'

interface CondoThemeApplierProps {
  theme: CondoTheme | null
}

export function CondoThemeApplier({ theme }: CondoThemeApplierProps) {
  useEffect(() => {
    if (theme?.enable_custom_theme) {
      // Apply theme to root element via CSS custom properties
      const root = document.documentElement
      
      root.style.setProperty('--condo-sidebar-bg', theme.sidebar_bg_color)
      root.style.setProperty('--condo-sidebar-text', theme.sidebar_text_color)
      root.style.setProperty('--condo-main-bg', theme.main_bg_color)
      root.style.setProperty('--condo-main-text', theme.main_text_color)
      root.style.setProperty('--condo-card-bg', theme.card_bg_color)
      root.style.setProperty('--condo-card-text', theme.card_text_color)
    } else {
      // Reset to defaults
      const root = document.documentElement
      root.style.removeProperty('--condo-sidebar-bg')
      root.style.removeProperty('--condo-sidebar-text')
      root.style.removeProperty('--condo-main-bg')
      root.style.removeProperty('--condo-main-text')
      root.style.removeProperty('--condo-card-bg')
      root.style.removeProperty('--condo-card-text')
    }
  }, [theme])

  return null
}
