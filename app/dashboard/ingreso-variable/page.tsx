import { createClient } from "@/lib/supabase/server"
import { getCondoIncome } from "../ingresos/actions"
import { IngresoVariableClient } from "./ingreso-variable-client"
import { redirect } from "next/navigation"
import { getUserCondoId } from "@/lib/supabase/owner-utils"
import Link from "next/link"
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createVariableIncome } from "@/app/dashboard/actions"
import { FileUpload } from "@/components/file-upload"

export default async function IngresoVariablePage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; año?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Get condo_id using the helper function
  const condoId = await getUserCondoId(supabase, user.id)

  if (!condoId) {
    redirect("/dashboard")
  }

  // Get period from query params
  const params = await searchParams
  const now = new Date()
  const year = parseInt(params.año as string) || now.getFullYear()
  const month = parseInt(params.mes as string) || now.getMonth() + 1

  // Calculate previous and next month for navigation
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const canGoNext = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)

  const monthName = new Date(year, month - 1).toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  })

  // Fetch variable income for the selected month
  const { data: variableIncome } = await getCondoIncome(supabase, condoId, month - 1, year)

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">Ingresos variables adicionales del condominio</p>

      {/* Month Navigation - Centered */}
      <div className="flex items-center justify-center gap-4">
        <Link href={`/dashboard/ingreso-variable?mes=${prevMonth}&año=${prevYear}`}>
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <span className="px-4 py-2 text-lg font-semibold capitalize min-w-[180px] text-center">
          {monthName}
        </span>
        {canGoNext ? (
          <Link href={`/dashboard/ingreso-variable?mes=${nextMonth}&año=${nextYear}`}>
            <Button variant="outline" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="icon" disabled>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Add Variable Income Button - Centered */}
      {isAdmin && condoId && (
        <div className="flex items-center justify-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                style={{
                  backgroundColor: "#2563eb",
                  color: "white",
                  padding: "12px 24px",
                  fontSize: "16px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  border: "2px solid #1d4ed8",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                <TrendingUp className="h-5 w-5" />
                Nuevo Ingreso Variable
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Registrar Ingreso Variable</DialogTitle>
              </DialogHeader>
              <form
                action={async (fd) => {
                  await createVariableIncome(fd)
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input id="description" name="description" placeholder="Descripción del ingreso" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="amount">Monto</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" placeholder="0.00" required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="income_date">Fecha</Label>
                    <Input id="income_date" name="income_date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="source">Fuente / Origen</Label>
                  <Input id="source" name="source" placeholder="Ej: Arriendo sala, Multa, etc." />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Respaldo</Label>
                  <FileUpload bucket="receipts" onUpload={(url) => {
                    const hiddenInput = document.getElementById('receipt_url') as HTMLInputElement
                    if (hiddenInput) hiddenInput.value = url
                  }} label="Subir comprobante" />
                  <input type="hidden" id="receipt_url" name="receipt_url" />
                </div>
                <Button type="submit" className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Guardar Ingreso</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Ingreso Variable Client Content */}
      <IngresoVariableClient 
        incomes={variableIncome || []}
        currencySymbol="$"
        isAdmin={isAdmin}
      />
    </div>
  )
}
