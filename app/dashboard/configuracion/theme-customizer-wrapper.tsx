'use client'

import { ThemeCustomizer } from '@/components/theme-customizer'
import { updateCondoTheme } from '@/app/actions/theme-actions'
import type { CondoTheme } from '@/lib/theme-utils'

interface ThemeCustomizerWrapperProps {
  condoId: string
  currentTheme: CondoTheme | null
  isAdmin?: boolean
  cardBgColor?: string
  cardTextColor?: string
}

export function ThemeCustomizerWrapper({ condoId, currentTheme, isAdmin = true, cardBgColor = "#1e293b", cardTextColor = "#f1f5f9" }: ThemeCustomizerWrapperProps) {
  const handleSave = async (themeData: Partial<CondoTheme>) => {
    try {
      console.log("[v0] Saving theme:", themeData)
      await updateCondoTheme(condoId, themeData)
      console.log("[v0] Theme saved successfully")
    } catch (error) {
      console.error('[v0] Error saving theme:', error)
      throw error
    }
  }

  console.log("[v0] ThemeCustomizer rendering with:", { condoId, currentTheme, isAdmin })

  return (
    <ThemeCustomizer 
      condoId={condoId} 
      currentTheme={currentTheme} 
      isAdmin={isAdmin}
      onSave={handleSave}
    />
  )
}
