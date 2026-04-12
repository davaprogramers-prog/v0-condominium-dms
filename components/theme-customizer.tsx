'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getContrastTextColor, type CondoTheme } from '@/lib/theme-utils'
import { AlertCircle, Save } from 'lucide-react'

interface ThemeCustomizerProps {
  condoId: string
  currentTheme: CondoTheme | null
  isAdmin: boolean
  onSave: (theme: Partial<CondoTheme>) => Promise<void>
}

export function ThemeCustomizer({ condoId, currentTheme, isAdmin, onSave }: ThemeCustomizerProps) {
  const [enableCustom, setEnableCustom] = useState(false)
  const [sidebarBg, setSidebarBg] = useState('#1e293b')
  const [mainBg, setMainBg] = useState('#f1f5f9')
  const [cardBg, setCardBg] = useState('#ffffff')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (currentTheme) {
      setEnableCustom(currentTheme.enable_custom_theme ?? false)
      setSidebarBg(currentTheme.sidebar_bg_color ?? '#1e293b')
      setMainBg(currentTheme.main_bg_color ?? '#f1f5f9')
      setCardBg(currentTheme.card_bg_color ?? '#ffffff')
    }
  }, [currentTheme])

  const sidebarText = getContrastTextColor(sidebarBg)
  const mainText = getContrastTextColor(mainBg)
  const cardText = getContrastTextColor(cardBg)

  const handleSave = async () => {
    try {
      setLoading(true)
      await onSave({
        enable_custom_theme: enableCustom,
        sidebar_bg_color: sidebarBg,
        sidebar_text_color: sidebarText,
        main_bg_color: mainBg,
        main_text_color: mainText,
        card_bg_color: cardBg,
        card_text_color: cardText,
      })
    } catch (error) {
      console.error('[v0] Error saving theme:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  if (!isAdmin) {
    return (
      <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
        <CardContent className="flex items-center gap-2 pt-6">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <p className="text-sm text-yellow-700 dark:text-yellow-200">Solo administradores pueden personalizar los colores</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-900 border-2 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Personalización de Colores</CardTitle>
        <CardDescription className="text-slate-400">
          Personaliza los colores de la aplicación para tu condominio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Custom Theme */}
        <div className="flex items-center justify-between rounded-lg border border-slate-700 p-4 bg-slate-800">
          <div>
            <Label className="text-white font-medium">Habilitar Personalización</Label>
            <p className="text-xs text-slate-400 mt-1">Activa colores personalizados para tu condominio</p>
          </div>
          <input 
            type="checkbox"
            checked={enableCustom} 
            onChange={(e) => setEnableCustom(e.target.checked)}
            className="w-6 h-6 cursor-pointer accent-blue-600"
          />
        </div>

        {enableCustom && (
          <>
            {/* Color Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sidebar Color */}
              <div className="space-y-3">
                <Label className="text-white font-medium text-sm">Barra Lateral</Label>
                <div className="space-y-2">
                  <input
                    type="color"
                    value={sidebarBg}
                    onChange={(e) => setSidebarBg(e.target.value)}
                    className="w-full h-24 rounded-lg cursor-pointer border-2 border-slate-600"
                  />
                  <div
                    className="w-full h-10 rounded-lg border-2 border-slate-600 flex items-center justify-center transition-colors"
                    style={{ backgroundColor: sidebarBg }}
                  >
                    <span style={{ color: sidebarText }} className="text-xs font-medium">
                      Texto
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{sidebarBg}</p>
                </div>
              </div>

              {/* Main Area Color */}
              <div className="space-y-3">
                <Label className="text-white font-medium text-sm">Fondo Principal</Label>
                <div className="space-y-2">
                  <input
                    type="color"
                    value={mainBg}
                    onChange={(e) => setMainBg(e.target.value)}
                    className="w-full h-24 rounded-lg cursor-pointer border-2 border-slate-600"
                  />
                  <div
                    className="w-full h-10 rounded-lg border-2 border-slate-600 flex items-center justify-center transition-colors"
                    style={{ backgroundColor: mainBg }}
                  >
                    <span style={{ color: mainText }} className="text-xs font-medium">
                      Texto
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{mainBg}</p>
                </div>
              </div>

              {/* Card Color */}
              <div className="space-y-3">
                <Label className="text-white font-medium text-sm">Tarjetas</Label>
                <div className="space-y-2">
                  <input
                    type="color"
                    value={cardBg}
                    onChange={(e) => setCardBg(e.target.value)}
                    className="w-full h-24 rounded-lg cursor-pointer border-2 border-slate-600"
                  />
                  <div
                    className="w-full h-10 rounded-lg border-2 border-slate-600 flex items-center justify-center transition-colors"
                    style={{ backgroundColor: cardBg }}
                  >
                    <span style={{ color: cardText }} className="text-xs font-medium">
                      Texto
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{cardBg}</p>
                </div>
              </div>
            </div>

            {/* Info Message */}
            <div className="bg-blue-950 border border-blue-700 rounded-lg p-3">
              <p className="text-xs text-blue-300">
                El color de texto se calcula automáticamente basado en el brillo del fondo.
              </p>
            </div>
          </>
        )}

        {/* Save Button */}
        <button 
          onClick={handleSave} 
          disabled={loading || !enableCustom}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Save className="h-4 w-4" />
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </CardContent>
    </Card>
  )
}
