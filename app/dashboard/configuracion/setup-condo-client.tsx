"use client"

import { createCondominium } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, AlertCircle } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function SetupCondoClient() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      setError(null)
      setLoading(true)
      const formData = new FormData(e.currentTarget)
      const result = await createCondominium(formData)
      
      if (!result.success) {
        setError(result.error || "Error desconocido")
        setLoading(false)
        return
      }

      if (result.redirect) {
        router.push(result.redirect)
      }
    } catch (err) {
      console.error("[v0] Setup error:", err)
      const message = err instanceof Error ? err.message : "Error al crear el condominio"
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
        <Building2 className="h-10 w-10 text-primary" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-balance">Configura tu Condominio</h1>
        <p className="mt-2 text-muted-foreground">
          Completa los datos iniciales para comenzar a usar CondoAdmin
        </p>
      </div>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Datos del Condominio</CardTitle>
          <CardDescription>Esta información se puede editar después</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="flex gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nombre del Condominio *</Label>
              <Input id="name" name="name" placeholder="Ej: Condominio Los Alerces" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" placeholder="Dirección completa" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="total_houses">Total de Casas</Label>
                <Input id="total_houses" name="total_houses" type="number" min={1} defaultValue={1} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="common_expense_amount">Gasto Común Mensual</Label>
                <Input id="common_expense_amount" name="common_expense_amount" type="number" step="0.01" defaultValue={0} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="currency">Moneda</Label>
                <Input id="currency" name="currency" defaultValue="CLP" placeholder="CLP" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="currency_symbol">Símbolo</Label>
                <Input id="currency_symbol" name="currency_symbol" defaultValue="$" placeholder="$" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="currency_multiplier">Multiplicador</Label>
                <Input id="currency_multiplier" name="currency_multiplier" type="number" step="0.01" defaultValue={1} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="payment_deadline_day">Día de vencimiento de pago</Label>
              <Input id="payment_deadline_day" name="payment_deadline_day" type="number" min={1} max={31} defaultValue={5} />
            </div>
            <Button type="submit" size="lg" className="mt-2" disabled={loading}>
              {loading ? "Creando Condominio..." : "Crear Condominio"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
        <Building2 className="h-10 w-10 text-primary" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-balance">Configura tu Condominio</h1>
        <p className="mt-2 text-muted-foreground">
          Completa los datos iniciales para comenzar a usar CondoAdmin
        </p>
      </div>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Datos del Condominio</CardTitle>
          <CardDescription>Esta información se puede editar después</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="flex gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nombre del Condominio *</Label>
              <Input id="name" name="name" placeholder="Ej: Condominio Los Alerces" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" placeholder="Dirección completa" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="total_houses">Total de Casas</Label>
                <Input id="total_houses" name="total_houses" type="number" min={1} defaultValue={1} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="common_expense_amount">Gasto Común Mensual</Label>
                <Input id="common_expense_amount" name="common_expense_amount" type="number" step="0.01" defaultValue={0} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="currency">Moneda</Label>
                <Input id="currency" name="currency" defaultValue="CLP" placeholder="CLP" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="currency_symbol">Símbolo</Label>
                <Input id="currency_symbol" name="currency_symbol" defaultValue="$" placeholder="$" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="currency_multiplier">Multiplicador</Label>
                <Input id="currency_multiplier" name="currency_multiplier" type="number" step="0.01" defaultValue={1} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="payment_deadline_day">Día de vencimiento de pago</Label>
              <Input id="payment_deadline_day" name="payment_deadline_day" type="number" min={1} max={31} defaultValue={5} />
            </div>
            <Button type="submit" size="lg" className="mt-2" disabled={loading}>
              {loading ? "Creando Condominio..." : "Crear Condominio"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
