"use client"

import { useState } from "react"
import { createPayment, verifyPayment } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/file-upload"
import { Plus, DollarSign, Check, X, Image as ImageIcon } from "lucide-react"
import { MONTHS_ES } from "@/lib/constants"
import { useTheme } from "@/app/dashboard/theme-context"

interface IngresosClientProps {
  payments: Record<string, unknown>[]
  houses: Record<string, unknown>[]
  currencySymbol: string
  commonExpenseAmount: number
  isAdmin: boolean
}

export function IngresosClient({ payments, houses, currencySymbol, commonExpenseAmount, isAdmin }: IngresosClientProps) {
  const [open, setOpen] = useState(false)
  const [selectedHouse, setSelectedHouse] = useState("")
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [paymentMethod, setPaymentMethod] = useState("transferencia")
  const [receiptUrl, setReceiptUrl] = useState("")
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("todos")
  const { inputBgColor, inputTextColor } = useTheme()

  const totalVerified = payments
    .filter((p) => p.status === "verificado")
    .reduce((a, p) => a + Number(p.amount || 0), 0)

  const totalPending = payments
    .filter((p) => p.status === "pendiente")
    .reduce((a, p) => a + Number(p.amount || 0), 0)

  const filteredPayments = statusFilter === "todos"
    ? payments
    : payments.filter((p) => p.status === statusFilter)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ingresos / Pagos</h1>
          <p className="text-sm text-muted-foreground">Gestion de pagos de gastos comunes</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Registrar Pago</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white">Registrar Pago</DialogTitle>
            </DialogHeader>
            <form
              action={async (fd) => {
                fd.set("house_id", selectedHouse)
                fd.set("period_month", selectedMonth)
                fd.set("period_year", selectedYear)
                fd.set("payment_method", paymentMethod)
                fd.set("receipt_url", receiptUrl)
                await createPayment(fd)
                setOpen(false)
                setReceiptUrl("")
                setSelectedHouse("")
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label className="text-slate-900 dark:text-slate-200">Casa</Label>
                <Select value={selectedHouse} onValueChange={setSelectedHouse}>
                  <SelectTrigger style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}>
                    <SelectValue placeholder="Seleccionar casa" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-800 dark:text-white">
                    {houses.map((h) => (
                      <SelectItem key={h.id as string} value={h.id as string}>
                        {h.house_number as string}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-slate-900 dark:text-slate-200">Mes</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}><SelectValue /></SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:text-white">
                      {MONTHS_ES.map((m, i) => (
                        <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-slate-900 dark:text-slate-200">Año</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}><SelectValue /></SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:text-white">
                      {[2024, 2025, 2026].map((y) => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="amount" className="text-slate-900 dark:text-slate-200">Monto</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" defaultValue={commonExpenseAmount} required style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="payment_date" className="text-slate-900 dark:text-slate-200">Fecha de Pago</Label>
                  <Input id="payment_date" name="payment_date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-slate-900 dark:text-slate-200">Método de Pago</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}><SelectValue /></SelectTrigger>
                  <SelectContent className="dark:bg-slate-800 dark:text-white">
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="deposito">Depósito</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-slate-900 dark:text-slate-200">Comprobante</Label>
                <FileUpload bucket="receipts" onUpload={setReceiptUrl} label="Subir comprobante" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="notes" className="text-slate-900 dark:text-slate-200">Notas</Label>
                <Textarea id="notes" name="notes" placeholder="Notas adicionales..." style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
              </div>
              <Button type="submit" disabled={!selectedHouse} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white">Guardar Pago</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Verificados</p>
            <p className="text-2xl font-bold text-emerald-600">{currencySymbol}{totalVerified.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pendientes</p>
            <p className="text-2xl font-bold text-amber-600">{currencySymbol}{totalPending.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Pagos</p>
            <p className="text-2xl font-bold">{payments.length}</p>
          </CardContent>
        </Card>
      </div>

      {previewImg && (
        <Dialog open={!!previewImg} onOpenChange={() => setPreviewImg(null)}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
            <div className="p-4">
              <img src={previewImg} alt="Comprobante" className="w-full rounded-lg border-2 border-slate-300 dark:border-slate-600" />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Listado de Pagos</CardTitle>
              <CardDescription>{filteredPayments.length} pagos</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="verificado">Verificados</SelectItem>
                <SelectItem value="rechazado">Rechazados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <DollarSign className="h-10 w-10" />
              <p>No hay pagos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Casa</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Metodo</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Comprobante</TableHead>
                    {isAdmin && <TableHead>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id as string}>
                      <TableCell className="font-medium">
                        {(payment.houses as Record<string, unknown>)?.house_number as string || "?"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {MONTHS_ES[(payment.period_month as number) - 1]} {payment.period_year as number}
                      </TableCell>
                      <TableCell className="text-sm">{payment.payment_date as string}</TableCell>
                      <TableCell className="text-sm capitalize">{(payment.payment_method as string) || "-"}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">
                        {currencySymbol}{Number(payment.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === "verificado" ? "default" :
                            payment.status === "rechazado" ? "destructive" : "secondary"
                          }
                          className="text-xs"
                        >
                          {payment.status as string}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.receipt_url ? (
                          <button
                            type="button"
                            onClick={() => setPreviewImg(payment.receipt_url as string)}
                            className="text-primary hover:underline"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </button>
                        ) : "-"}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          {payment.status === "pendiente" && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => verifyPayment(payment.id as string, "verificado")}
                                className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                                title="Verificar"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => verifyPayment(payment.id as string, "rechazado")}
                                className="rounded p-1 text-destructive hover:bg-destructive/10"
                                title="Rechazar"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </TableCell>
                      )}
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
