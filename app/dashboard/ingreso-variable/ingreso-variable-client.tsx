"use client"

import { useState } from "react"
import { createVariableIncome } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileUpload } from "@/components/file-upload"
import { Plus, TrendingUp } from "lucide-react"

interface IngresoVariableClientProps {
  incomes: Record<string, unknown>[]
  currencySymbol: string
  isAdmin: boolean
}

export function IngresoVariableClient({ incomes, currencySymbol, isAdmin }: IngresoVariableClientProps) {
  const [open, setOpen] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState("")

  const total = incomes.reduce((a, i) => a + Number(i.amount || 0), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ingreso Variable</h1>
          <p className="text-sm text-muted-foreground">
            {"Total acumulado: "}
            <span className="font-semibold text-foreground">{currencySymbol}{total.toLocaleString()}</span>
          </p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Nuevo Ingreso</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Ingreso Variable</DialogTitle>
              </DialogHeader>
              <form
                action={async (fd) => {
                  fd.set("receipt_url", receiptUrl)
                  await createVariableIncome(fd)
                  setOpen(false)
                  setReceiptUrl("")
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Descripcion</Label>
                  <Input id="description" name="description" placeholder="Descripcion del ingreso" required />
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
                  <FileUpload bucket="receipts" onUpload={setReceiptUrl} label="Subir comprobante" />
                </div>
                <Button type="submit">Guardar Ingreso</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ingresos Variables</CardTitle>
          <CardDescription>{incomes.length} registros</CardDescription>
        </CardHeader>
        <CardContent>
          {incomes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <TrendingUp className="h-10 w-10" />
              <p>No hay ingresos variables registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripcion</TableHead>
                    <TableHead>Fuente</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomes.map((income) => (
                    <TableRow key={income.id as string}>
                      <TableCell className="text-sm">{income.income_date as string}</TableCell>
                      <TableCell className="text-sm">{income.description as string}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{(income.source as string) || "-"}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">
                        {currencySymbol}{Number(income.amount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
