'use client'

import { createContext, useContext, ReactNode } from 'react'
import { type CondoTheme, DEFAULT_THEME } from '@/lib/theme-utils'

interface ThemeContextType {
  theme: CondoTheme | null
  sidebarBgColor: string
  sidebarTextColor: string
  mainBgColor: string
  mainTextColor: string
  cardBgColor: string
  cardTextColor: string
  dialogBgColor: string
  dialogTextColor: string
  inputBgColor: string
  inputTextColor: string
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  theme: CondoTheme | null
}

export function ThemeProvider({ children, theme }: ThemeProviderProps) {
  // Use custom theme if enabled, otherwise use defaults
  const isCustom = theme?.enable_custom_theme

  const value: ThemeContextType = {
    theme,
    sidebarBgColor: isCustom ? theme!.sidebar_bg_color : DEFAULT_THEME.sidebar_bg_color,
    sidebarTextColor: isCustom ? theme!.sidebar_text_color : DEFAULT_THEME.sidebar_text_color,
    mainBgColor: isCustom ? theme!.main_bg_color : DEFAULT_THEME.main_bg_color,
    mainTextColor: isCustom ? theme!.main_text_color : DEFAULT_THEME.main_text_color,
    cardBgColor: isCustom ? theme!.card_bg_color : DEFAULT_THEME.card_bg_color,
    cardTextColor: isCustom ? theme!.card_text_color : DEFAULT_THEME.card_text_color,
    dialogBgColor: isCustom ? theme!.dialog_bg_color : DEFAULT_THEME.dialog_bg_color,
    dialogTextColor: isCustom ? theme!.dialog_text_color : DEFAULT_THEME.dialog_text_color,
    inputBgColor: isCustom ? theme!.input_bg_color : DEFAULT_THEME.input_bg_color,
    inputTextColor: isCustom ? theme!.input_text_color : DEFAULT_THEME.input_text_color,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
