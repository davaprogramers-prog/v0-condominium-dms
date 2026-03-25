"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface ParametersFormProps {
  condoId: string
  currentParams: any
}

export function ParametersForm({ condoId, currentParams }: ParametersFormProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const data = {
      condo_id: condoId,
      current_month: parseInt(formData.get("current_month") as string),
      current_year: parseInt(formData.get("current_year") as string),
      payment_deadline_day: parseInt(formData.get("payment_deadline_day") as string),
      enable_late_fees: formData.get("enable_late_fees") === "on",
      late_fee_percentage: parseFloat(formData.get("late_fee_percentage") as string) || 0,
    }

    if (currentParams?.id) {
      const { error } = await supabase
        .from("parameters")
        .update(data)
        .eq("id", currentParams.id)

      if (error) {
        console.error("[v0] Error updating parameters:", error)
        setLoading(false)
        return
      }
    } else {
      const { error } = await supabase
        .from("parameters")
        .insert(data)

      if (error) {
        console.error("[v0] Error creating parameters:", error)
        setLoading(false)
        return
      }
    }

    router.refresh()
    setLoading(false)
  }

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Parámetros del Condominio</h2>
        <p className="text-sm text-muted-foreground mt-1">Configuración de mes actual, vencimientos y moratorios</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="current_month">Mes Actual *</Label>
            <Input
              id="current_month"
              name="current_month"
              type="number"
              min={1}
              max={12}
              defaultValue={currentParams?.current_month || currentMonth}
              required
            />
            <p className="text-xs text-muted-foreground">Mes para pagos de gasto común</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_year">Año Actual *</Label>
            <Input
              id="current_year"
              name="current_year"
              type="number"
              defaultValue={currentParams?.current_year || currentYear}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_deadline_day">Día de Vencimiento *</Label>
          <Input
            id="payment_deadline_day"
            name="payment_deadline_day"
            type="number"
            min={1}
            max={31}
            defaultValue={currentParams?.payment_deadline_day || 5}
            required
          />
          <p className="text-xs text-muted-foreground">Día del mes en que vence el pago de gasto común</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div>
              <Label htmlFor="enable_late_fees" className="cursor-pointer">Habilitar Multa por Atraso</Label>
              <p className="text-xs text-muted-foreground mt-1">Aplicar porcentaje a pagos atrasados</p>
            </div>
            <Switch
              id="enable_late_fees"
              name="enable_late_fees"
              defaultChecked={currentParams?.enable_late_fees || false}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="late_fee_percentage">Porcentaje de Multa (%)</Label>
            <Input
              id="late_fee_percentage"
              name="late_fee_percentage"
              type="number"
              min={0}
              max={100}
              step={0.01}
              defaultValue={currentParams?.late_fee_percentage || 0}
              placeholder="0.00"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Guardar Parámetros
        </Button>
      </form>
    </div>
  )
}
