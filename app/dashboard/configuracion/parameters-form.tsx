"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { regenerateMonthlyIncome } from "./actions"

interface ParametersFormProps {
  condoId: string
  currentParams: any
  cardBgColor?: string
  cardTextColor?: string
  inputBgColor?: string
  inputTextColor?: string
}

export function ParametersForm({ condoId, currentParams, cardBgColor = "#1e293b", cardTextColor = "#f1f5f9", inputBgColor = "#0f172a", inputTextColor = "#e2e8f0" }: ParametersFormProps) {
  const [loading, setLoading] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [regenerateResult, setRegenerateResult] = useState<{success: boolean, message: string} | null>(null)
  const [fineType, setFineType] = useState(currentParams?.fine_type || "porcentaje")
  const router = useRouter()

  async function handleRegenerate() {
    setRegenerating(true)
    setRegenerateResult(null)
    try {
      const result = await regenerateMonthlyIncome(condoId)
      setRegenerateResult(result)
      router.refresh()
    } catch (error) {
      setRegenerateResult({ success: false, message: error instanceof Error ? error.message : "Error desconocido" })
    }
    setRegenerating(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    const initialBalanceDate = formData.get("initial_balance_date") as string
    const data = {
      condo_id: condoId,
      current_month: parseInt(formData.get("current_month") as string),
      current_year: parseInt(formData.get("current_year") as string),
      payment_deadline_day: parseInt(formData.get("payment_deadline_day") as string),
      enable_late_fees: formData.get("enable_late_fees") === "on",
      fine_type: fineType,
      late_fee_percentage: fineType === "porcentaje" ? parseFloat(formData.get("late_fee_percentage") as string) || 0 : 0,
      fine_fixed_amount: fineType === "fijo" ? parseFloat(formData.get("fine_fixed_amount") as string) || 0 : 0,
      fine_uf_amount: fineType === "uf" ? parseFloat(formData.get("fine_uf_amount") as string) || 0 : 0,
      fixed_income_amount: parseFloat(formData.get("fixed_income_amount") as string) || 0,
      variable_income_amount: parseFloat(formData.get("variable_income_amount") as string) || 0,
      initial_balance: parseFloat(formData.get("initial_balance") as string) || 0,
      initial_balance_date: initialBalanceDate && initialBalanceDate.trim() !== "" ? initialBalanceDate : null,
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
    <div 
      className="rounded-lg border p-6 space-y-6"
      style={{
        backgroundColor: cardBgColor,
        color: cardTextColor,
        borderColor: "rgba(255,255,255,0.1)"
      }}
    >
      <div>
        <h2 className="text-xl font-semibold" style={{ color: cardTextColor }}>Parámetros del Condominio</h2>
        <p className="text-sm mt-1" style={{ color: cardTextColor, opacity: 0.7 }}>Configuración de mes actual, vencimientos, saldo inicial, gastos y moratorios</p>
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
          <Label htmlFor="payment_deadline_day">Dia de Vencimiento *</Label>
          <Input
            id="payment_deadline_day"
            name="payment_deadline_day"
            type="number"
            min={1}
            max={31}
            defaultValue={currentParams?.payment_deadline_day || 5}
            required
          />
          <p className="text-xs text-muted-foreground">Dia del mes en que vence el pago de gasto comun</p>
        </div>

        {/* Initial Balance Section */}
        <div className="space-y-4 pt-4 border-t">
          <div>
            <h3 className="text-sm font-medium">Saldo Inicial</h3>
            <p className="text-xs text-muted-foreground">Punto de partida para el balance del condominio (solo se usa el primer mes)</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="initial_balance">Monto Saldo Inicial</Label>
              <Input
                id="initial_balance"
                name="initial_balance"
                type="number"
                step={1}
                defaultValue={currentParams?.initial_balance || 0}
                placeholder="Ej: 500000"
              />
              <p className="text-xs text-muted-foreground">Saldo anterior al inicio del registro</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initial_balance_date">Fecha de Inicio</Label>
              <Input
                id="initial_balance_date"
                name="initial_balance_date"
                type="date"
                defaultValue={currentParams?.initial_balance_date || ""}
              />
              <p className="text-xs text-muted-foreground">Fecha desde cuando aplica este saldo</p>
            </div>
          </div>

          {currentParams?.initial_balance_date && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Saldo inicial de <strong>${(currentParams?.initial_balance || 0).toLocaleString("es-CL")}</strong> registrado desde{" "}
                <strong>{new Date(currentParams.initial_balance_date).toLocaleDateString("es-CL")}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Income Amounts Section */}
        <div className="space-y-4 pt-4 border-t">
          <div>
            <h3 className="text-sm font-medium">Montos de Gasto Comun</h3>
            <p className="text-xs text-muted-foreground">Valores que deben pagar los propietarios mensualmente</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fixed_income_amount">Gasto Comun Fijo</Label>
              <Input
                id="fixed_income_amount"
                name="fixed_income_amount"
                type="number"
                min={0}
                step={1}
                defaultValue={currentParams?.fixed_income_amount || 0}
                placeholder="Ej: 50000"
              />
              <p className="text-xs text-muted-foreground">Monto fijo mensual por unidad</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="variable_income_amount">Gasto Comun Variable</Label>
              <Input
                id="variable_income_amount"
                name="variable_income_amount"
                type="number"
                min={0}
                step={1}
                defaultValue={currentParams?.variable_income_amount || 0}
                placeholder="Ej: 15000"
              />
              <p className="text-xs text-muted-foreground">Monto variable (agua, luz, etc.)</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Gasto Comun:</span>
              <span className="font-semibold">
                ${((currentParams?.fixed_income_amount || 0) + (currentParams?.variable_income_amount || 0)).toLocaleString("es-CL")}
              </span>
            </div>
          </div>
        </div>

        {/* Late Fees Section */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div>
              <Label htmlFor="enable_late_fees" className="cursor-pointer">Habilitar Multa por Atraso</Label>
              <p className="text-xs text-muted-foreground mt-1">Aplicar multa a pagos atrasados</p>
            </div>
            <Switch
              id="enable_late_fees"
              name="enable_late_fees"
              defaultChecked={currentParams?.enable_late_fees || false}
            />
          </div>

          <div className="space-y-2">
            <Label style={{ color: cardTextColor }}>Tipo de Multa</Label>
            <Select value={fineType} onValueChange={setFineType}>
              <SelectTrigger style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}>
                <SelectValue placeholder="Seleccionar tipo de multa" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                <SelectItem value="porcentaje" style={{ color: inputTextColor }}>Porcentaje del gasto comun</SelectItem>
                <SelectItem value="fijo" style={{ color: inputTextColor }}>Monto fijo</SelectItem>
                <SelectItem value="uf" style={{ color: inputTextColor }}>Monto en UF</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs" style={{ color: cardTextColor, opacity: 0.6 }}>
              {fineType === "porcentaje" && "Se aplicara un porcentaje sobre el valor del gasto comun"}
              {fineType === "fijo" && "Se cobrara un monto fijo independiente del gasto comun"}
              {fineType === "uf" && "Se cobrara el valor en UF segun cotizacion del dia de vencimiento"}
            </p>
          </div>

          {fineType === "porcentaje" && (
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
                placeholder="Ej: 3"
              />
            </div>
          )}

          {fineType === "fijo" && (
            <div className="space-y-2">
              <Label htmlFor="fine_fixed_amount">Monto Fijo de Multa</Label>
              <Input
                id="fine_fixed_amount"
                name="fine_fixed_amount"
                type="number"
                min={0}
                step={1}
                defaultValue={currentParams?.fine_fixed_amount || 0}
                placeholder="Ej: 5000"
              />
              <p className="text-xs text-muted-foreground">En la moneda configurada del condominio</p>
            </div>
          )}

          {fineType === "uf" && (
            <div className="space-y-2">
              <Label htmlFor="fine_uf_amount">Monto en UF</Label>
              <Input
                id="fine_uf_amount"
                name="fine_uf_amount"
                type="number"
                min={0}
                step={0.01}
                defaultValue={currentParams?.fine_uf_amount || 0}
                placeholder="Ej: 2"
              />
              <p className="text-xs text-muted-foreground">Se convertira al valor UF del dia de vencimiento</p>
            </div>
          )}
        </div>

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 sm:py-6 text-sm sm:text-base font-semibold" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Guardar Parámetros
        </Button>
      </form>

      {/* Regenerate Income Section */}
      <div className="space-y-4 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <div>
          <h3 className="text-sm font-medium" style={{ color: cardTextColor }}>Generar Ingresos Mensuales</h3>
          <p className="text-xs mt-1" style={{ color: cardTextColor, opacity: 0.6 }}>
            Crea automáticamente los registros de gasto común (fijo y variable) para todas las casas que no lo tengan en el mes actual
          </p>
        </div>
        
        <Button 
          type="button" 
          className="w-full border-2 min-h-12 sm:min-h-14 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-medium line-clamp-2 sm:line-clamp-1 flex items-center justify-center gap-2"
          style={{ 
            backgroundColor: inputBgColor, 
            color: inputTextColor, 
            borderColor: inputTextColor
          }}
          onClick={handleRegenerate}
          disabled={regenerating || !currentParams?.fixed_income_amount}
        >
          {regenerating ? (
            <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 flex-shrink-0" />
          )}
          <span className="break-words">Generar Ingresos para Mes Actual</span>
        </Button>

        {!currentParams?.fixed_income_amount && (
          <p className="text-xs" style={{ color: inputTextColor, opacity: 0.7 }}>
            Primero configura los montos de gasto común fijo y variable arriba
          </p>
        )}

        {regenerateResult && (
          <div className={`p-3 rounded-lg border ${
            regenerateResult.success 
              ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300"
              : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300"
          }`}>
            <p className="text-sm">{regenerateResult.message}</p>
          </div>
        )}
      </div>
    </div>
  )
}
