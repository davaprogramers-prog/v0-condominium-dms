"use client"

import { useState } from "react"
import { updateCondominium } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Settings, Building2, DollarSign, Eye, Calendar } from "lucide-react"

interface ConfiguracionClientProps {
  condo: Record<string, unknown> | null
}

export function ConfiguracionClient({ condo }: ConfiguracionClientProps) {
  const [cardsPublic, setCardsPublic] = useState((condo?.cards_public as boolean) || false)
  const [saved, setSaved] = useState(false)

  if (!condo) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-muted-foreground">
        <Settings className="h-12 w-12" />
        <p>No hay condominio configurado</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Configuracion</h1>
        <p className="text-sm text-muted-foreground">Ajustes generales del condominio</p>
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
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Datos del Condominio</CardTitle>
            </div>
            <CardDescription>Informacion general</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="condo_name">Nombre</Label>
                <Input id="condo_name" name="name" defaultValue={(condo.name as string) || ""} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="condo_address">Direccion</Label>
                <Input id="condo_address" name="address" defaultValue={(condo.address as string) || ""} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Moneda y Gastos Comunes</CardTitle>
            </div>
            <CardDescription>Configuracion de moneda y monto de gastos comunes</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="currency">Codigo de Moneda</Label>
                <Input id="currency" name="currency" defaultValue={(condo.currency as string) || "CLP"} placeholder="CLP, USD, EUR..." />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="currency_symbol">Simbolo</Label>
                <Input id="currency_symbol" name="currency_symbol" defaultValue={(condo.currency_symbol as string) || "$"} placeholder="$" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="currency_multiplier">Multiplicador</Label>
                <Input id="currency_multiplier" name="currency_multiplier" type="number" step="0.01" defaultValue={Number(condo.currency_multiplier) || 1} />
                <p className="text-xs text-muted-foreground">Para conversiones UF, UTM, etc.</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="common_expense_amount">Monto Gasto Comun</Label>
                <Input id="common_expense_amount" name="common_expense_amount" type="number" step="0.01" defaultValue={Number(condo.common_expense_amount) || 0} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="payment_deadline_day">Dia de vencimiento (global)</Label>
                <Input id="payment_deadline_day" name="payment_deadline_day" type="number" min={1} max={31} defaultValue={Number(condo.payment_deadline_day) || 5} />
                <p className="text-xs text-muted-foreground">Se puede personalizar por casa</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Visibilidad</CardTitle>
            </div>
            <CardDescription>Controla que informacion es publica</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label>Cards de casas publicos</Label>
                <p className="text-sm text-muted-foreground">
                  Permite que todos los residentes vean las tarjetas de estado de las casas
                </p>
              </div>
              <Switch checked={cardsPublic} onCheckedChange={setCardsPublic} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" size="lg">Guardar Configuracion</Button>
          {saved && <span className="text-sm text-emerald-600">Configuracion guardada correctamente</span>}
        </div>
      </form>
    </div>
  )
}
