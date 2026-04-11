"use client"

import { useState, useEffect } from "react"
import { updateCondominium } from "@/app/dashboard/actions"
import { updateCondoTheme } from "@/app/actions/theme-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ThemeCustomizer } from "@/components/theme-customizer"
import { Settings, Building2, DollarSign, Eye, Calendar } from "lucide-react"
import { type CondoTheme } from "@/lib/theme-utils"

interface ConfiguracionClientProps {
  condo: Record<string, unknown> | null
  theme: CondoTheme | null
  isAdmin: boolean
}

export function ConfiguracionClient({ condo, theme, isAdmin }: ConfiguracionClientProps) {
  const [cardsPublic, setCardsPublic] = useState((condo?.cards_public as boolean) || false)
  const [saved, setSaved] = useState(false)
  const [themeSaved, setThemeSaved] = useState(false)

  if (!condo) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-muted-foreground">
        <Settings className="h-12 w-12" />
        <p>No hay condominio configurado</p>
      </div>
    )
  }

  const handleThemeSave = async (themeData: Partial<CondoTheme>) => {
    try {
      await updateCondoTheme(condo.id as string, themeData)
      setThemeSaved(true)
      setTimeout(() => setThemeSaved(false), 3000)
    } catch (error) {
      console.error("Error saving theme:", error)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configuracion</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Ajustes generales del condominio</p>
      </div>

      <form
        action={async (fd) => {
          fd.set("cards_public", cardsPublic.toString())
          await updateCondominium(fd)
          setSaved(true)
          setTimeout(() => setSaved(false), 3000)
        }}
        className="flex flex-col gap-6"
      >
        <Card className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <CardTitle className="text-base text-slate-900 dark:text-white">Datos del Condominio</CardTitle>
            </div>
            <CardDescription className="text-slate-600 dark:text-slate-400">Informacion general</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="condo_name" className="text-slate-900 dark:text-slate-200">Nombre</Label>
                <Input id="condo_name" name="name" defaultValue={(condo.name as string) || ""} required className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="condo_address" className="text-slate-900 dark:text-slate-200">Direccion</Label>
                <Input id="condo_address" name="address" defaultValue={(condo.address as string) || ""} className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <CardTitle className="text-base text-slate-900 dark:text-white">Moneda y Gastos Comunes</CardTitle>
            </div>
            <CardDescription className="text-slate-600 dark:text-slate-400">Configuracion de moneda y monto de gastos comunes</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="currency" className="text-slate-900 dark:text-slate-200">Codigo de Moneda</Label>
                <Input id="currency" name="currency" defaultValue={(condo.currency as string) || "CLP"} placeholder="CLP, USD, EUR..." className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="currency_symbol" className="text-slate-900 dark:text-slate-200">Simbolo</Label>
                <Input id="currency_symbol" name="currency_symbol" defaultValue={(condo.currency_symbol as string) || "$"} placeholder="$" className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="currency_multiplier" className="text-slate-900 dark:text-slate-200">Multiplicador</Label>
                <Input id="currency_multiplier" name="currency_multiplier" type="number" step="0.01" defaultValue={Number(condo.currency_multiplier) || 1} className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                <p className="text-xs text-slate-600 dark:text-slate-400">Para conversiones UF, UTM, etc.</p>
              </div>
            </div>
            <Separator className="bg-slate-200 dark:bg-slate-700" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="common_expense_amount" className="text-slate-900 dark:text-slate-200">Monto Gasto Comun</Label>
                <Input id="common_expense_amount" name="common_expense_amount" type="number" step="0.01" defaultValue={Number(condo.common_expense_amount) || 0} className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="payment_deadline_day" className="text-slate-900 dark:text-slate-200">Dia de vencimiento (global)</Label>
                <Input id="payment_deadline_day" name="payment_deadline_day" type="number" min={1} max={31} defaultValue={Number(condo.payment_deadline_day) || 5} className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                <p className="text-xs text-slate-600 dark:text-slate-400">Se puede personalizar por casa</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <CardTitle className="text-base text-slate-900 dark:text-white">Visibilidad</CardTitle>
            </div>
            <CardDescription className="text-slate-600 dark:text-slate-400">Controla que informacion es publica</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-900 dark:text-white">Cards de casas publicos</Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Permite que todos los residentes vean las tarjetas de estado de las casas
                </p>
              </div>
              <Switch checked={cardsPublic} onCheckedChange={setCardsPublic} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" size="lg" className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Guardar Configuracion</Button>
          {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Configuracion guardada correctamente</span>}
        </div>
      </form>

      {/* Theme Customizer */}
      <ThemeCustomizer 
        condoId={condo.id as string} 
        currentTheme={theme} 
        isAdmin={isAdmin}
        onSave={handleThemeSave}
      />
      {themeSaved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Tema guardado correctamente</span>}
    </div>
  )
}
