'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
  const [enableCustom, setEnableCustom] = useState(currentTheme?.enable_custom_theme ?? false)
  const [sidebarBg, setSidebarBg] = useState(currentTheme?.sidebar_bg_color ?? '#1e293b')
  const [mainBg, setMainBg] = useState(currentTheme?.main_bg_color ?? '#f1f5f9')
  const [cardBg, setCardBg] = useState(currentTheme?.card_bg_color ?? '#ffffff')
  const [loading, setLoading] = useState(false)

  const sidebarText = getContrastTextColor(sidebarBg)
  const mainText = getContrastTextColor(mainBg)
  const cardText = getContrastTextColor(cardBg)

  useEffect(() => {
    if (currentTheme) {
      setEnableCustom(currentTheme.enable_custom_theme)
      setSidebarBg(currentTheme.sidebar_bg_color)
      setMainBg(currentTheme.main_bg_color)
      setCardBg(currentTheme.card_bg_color)
    }
  }, [currentTheme])

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
    } finally {
      setLoading(false)
    }
  }

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
    <Card className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-900 dark:text-white">Personalización de Colores</CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          Personaliza los colores de la aplicación para tu condominio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Custom Theme */}
        <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800">
          <div>
            <Label className="text-slate-900 dark:text-white font-medium">Habilitar Personalización</Label>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Activa colores personalizados para tu condominio</p>
          </div>
          <Switch checked={enableCustom} onCheckedChange={setEnableCustom} />
        </div>

        {enableCustom && (
          <>
            {/* Color Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sidebar Color */}
              <div className="space-y-3">
                <Label className="text-slate-900 dark:text-white font-medium">Color de Barra Lateral</Label>
                <div className="space-y-2">
                  <input
                    type="color"
                    value={sidebarBg}
                    onChange={(e) => setSidebarBg(e.target.value)}
                    className="w-full h-32 rounded-lg cursor-pointer border-2 border-slate-300 dark:border-slate-600"
                  />
                  <div
                    className="w-full h-12 rounded-lg border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center transition-colors"
                    style={{ backgroundColor: sidebarBg }}
                  >
                    <span style={{ color: sidebarText }} className="text-sm font-medium">
                      Texto de Barra
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{sidebarBg}</p>
                </div>
              </div>

              {/* Main Area Color */}
              <div className="space-y-3">
                <Label className="text-slate-900 dark:text-white font-medium">Color de Fondo Principal</Label>
                <div className="space-y-2">
                  <input
                    type="color"
                    value={mainBg}
                    onChange={(e) => setMainBg(e.target.value)}
                    className="w-full h-32 rounded-lg cursor-pointer border-2 border-slate-300 dark:border-slate-600"
                  />
                  <div
                    className="w-full h-12 rounded-lg border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center transition-colors"
                    style={{ backgroundColor: mainBg }}
                  >
                    <span style={{ color: mainText }} className="text-sm font-medium">
                      Texto Principal
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{mainBg}</p>
                </div>
              </div>

              {/* Card Color */}
              <div className="space-y-3">
                <Label className="text-slate-900 dark:text-white font-medium">Color de Tarjetas</Label>
                <div className="space-y-2">
                  <input
                    type="color"
                    value={cardBg}
                    onChange={(e) => setCardBg(e.target.value)}
                    className="w-full h-32 rounded-lg cursor-pointer border-2 border-slate-300 dark:border-slate-600"
                  />
                  <div
                    className="w-full h-12 rounded-lg border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center transition-colors"
                    style={{ backgroundColor: cardBg }}
                  >
                    <span style={{ color: cardText }} className="text-sm font-medium">
                      Texto Tarjeta
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{cardBg}</p>
                </div>
              </div>
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                El color de texto se calcula automáticamente basado en el brillo del fondo para garantizar legibilidad.
              </p>
            </div>
          </>
        )}

        {/* Save Button */}
        <Button onClick={handleSave} disabled={loading} className="w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </CardContent>
    </Card>
  )
}
