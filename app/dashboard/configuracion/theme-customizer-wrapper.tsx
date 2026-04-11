'use client'

import { ThemeCustomizer } from '@/components/theme-customizer'
import { updateCondoTheme } from '@/app/actions/theme-actions'
import type { CondoTheme } from '@/lib/theme-utils'

interface ThemeCustomizerWrapperProps {
  condoId: string
  currentTheme: CondoTheme | null
}

export function ThemeCustomizerWrapper({ condoId, currentTheme }: ThemeCustomizerWrapperProps) {
  const handleSave = async (themeData: Partial<CondoTheme>) => {
    try {
      await updateCondoTheme(condoId, themeData)
    } catch (error) {
      console.error('Error saving theme:', error)
      throw error
    }
  }

  return (
    <ThemeCustomizer 
      condoId={condoId} 
      currentTheme={currentTheme} 
      isAdmin={true}
      onSave={handleSave}
    />
  )
}
