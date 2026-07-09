"use client"

import { useState, useTransition } from "react"
import { createInfraction, markInfractionPaid, updateInfraction, deleteInfraction, markInfractionPaidWithIncome } from "@/app/dashboard/actions"
import { formatCurrency, formatCurrencyNumber } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Plus, AlertTriangle, CheckCircle, MoreHorizontal, Edit2, Trash2, CircleAlertIcon, TriangleAlert } from "lucide-react"
import { useTheme } from "@/app/dashboard/theme-context"
import { Alert } from "@/components/ui/alert"

interface Infraction {
  id: string
  house_id: string
  description: string
  fine_amount: number
  period_month: number
  period_year: number
  is_paid: boolean
  status?: string
  currency?: string
  amount_pending?: number
  payment_status?: string
  uf_value_at_creation?: number
  [key: string]: unknown
}

interface House {
  id: string
  house_number: string
  owner_name?: string
  [key: string]: unknown
}

interface InfraccionesClientProps {
  infractions: Infraction[]
  houses: House[]
  currencySymbol: string
  isAdmin: boolean
}

export function InfraccionesClient({ infractions, houses, currencySymbol, isAdmin }: InfraccionesClientProps) {
  const [openNew, setOpenNew] = useState(false)
  const [selectedHouse, setSelectedHouse] = useState("")
  const [filter, setFilter] = useState("todas")
  const [editOpen, setEditOpen] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState<string | null>(null)
  const [paymentOpen, setPaymentOpen] = useState<string | null>(null)
  const [currency, setCurrency] = useState("CLP")
  const [paymentType, setPaymentType] = useState("complete")
  const [ufValue, setUfValue] = useState("")
  const [isPending, startTransition] = useTransition()
  const { inputBgColor, inputTextColor, dialogBgColor, dialogTextColor } = useTheme()

  const pendingCount = infractions.filter((i) => !i.is_paid).length
  const paidCount = infractions.filter((i) => i.is_paid).length
  const totalFines = infractions.reduce((a, i) => a + Number(i.fine_amount || 0), 0)

  const filtered = filter === "todas"
    ? infractions
    : filter === "pendientes"
      ? infractions.filter((i) => !i.is_paid)
      : infractions.filter((i) => i.is_paid)

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Info */}
      <div className="text-sm text-muted-foreground">
        {pendingCount} pendientes, {paidCount} pagadas
      </div>

      {/* New Infraction Button - Centered */}
      {isAdmin && (
        <div className="flex items-center justify-center">
          <Dialog open={openNew} onOpenChange={setOpenNew}>
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
                <TriangleAlert className="h-5 w-5" />
                Nueva Infraccion
              </Button>

            </DialogTrigger>
            <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }} className="max-w-lg">
              <DialogHeader>
                <DialogTitle style={{ color: dialogTextColor }}>Registrar Infraccion</DialogTitle>
              </DialogHeader>
              <form
                action={async (fd) => {
                  fd.set("house_id", selectedHouse)
                  fd.set("currency", currency)
                  fd.set("payment_status", paymentType === "complete" ? "complete" : "pending")
                  if (currency === "UF" && ufValue) {
                    fd.set("uf_value_at_creation", ufValue)
                  }
                  await createInfraction(fd)
                  setOpenNew(false)
                  setSelectedHouse("")
                  setCurrency("CLP")
                  setPaymentType("complete")
                  setUfValue("")
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label style={{ color: dialogTextColor }}>Casa</Label>
                  <Select value={selectedHouse} onValueChange={setSelectedHouse}>
                    <SelectTrigger style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}><SelectValue placeholder="Seleccionar casa" /></SelectTrigger>
                    <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}>
                      {houses.map((h) => (
                        <SelectItem key={h.id as string} value={h.id as string}>{h.house_number as string}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="inf_desc" style={{ color: dialogTextColor }}>Descripcion</Label>
                  <Textarea id="inf_desc" name="description" placeholder="Detalle de la infraccion..." required style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label style={{ color: dialogTextColor }}>Moneda</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}><SelectValue /></SelectTrigger>
                      <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}>
                        <SelectItem value="CLP">CLP ({currencySymbol})</SelectItem>
                        <SelectItem value="UF">UF (Unidad de Fomento)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label style={{ color: dialogTextColor }}>Tipo Pago</Label>
                    <Select value={paymentType} onValueChange={setPaymentType}>
                      <SelectTrigger style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}><SelectValue /></SelectTrigger>
                      <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}>
                        <SelectItem value="complete">Pagada Completa</SelectItem>
                        <SelectItem value="installment">En Cuotas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="fine_amount" style={{ color: dialogTextColor }}>Multa ({currency === "UF" ? "UF" : currencySymbol})</Label>
                    <Input id="fine_amount" name="fine_amount" type="number" step={currency === "UF" ? "0.01" : "0.01"} placeholder="0.00" required style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="inf_date" style={{ color: dialogTextColor }}>Fecha</Label>
                    <Input id="inf_date" name="infraction_date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                  </div>
                </div>
                {currency === "UF" && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="uf_value" style={{ color: dialogTextColor }}>Valor UF a la fecha ({currencySymbol})</Label>
                    <Input id="uf_value" type="number" step="0.01" placeholder="Ej: 40000" value={ufValue} onChange={(e) => setUfValue(e.target.value)} style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                    <p className="text-xs opacity-75">Para referencia al momento de pagar</p>
                  </div>
                )}
                <Button type="submit" disabled={!selectedHouse} className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Registrar Infraccion</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Multas</p>
            <p className="text-2xl font-bold">{formatCurrency(totalFines, currencySymbol)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pendientes</p>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pagadas</p>
            <p className="text-2xl font-bold text-emerald-600">{paidCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Registro de Infracciones</CardTitle>
              <CardDescription>{filtered.length} registros</CardDescription>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-36" style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}><SelectValue /></SelectTrigger>
              <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="pendientes">Pendientes</SelectItem>
                <SelectItem value="pagadas">Pagadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <AlertTriangle className="h-10 w-10" />
              <p>No hay infracciones registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Casa</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripcion</TableHead>
                    <TableHead className="text-right">Multa</TableHead>
                    <TableHead>Moneda</TableHead>
                    <TableHead className="text-right">Saldo Pendiente</TableHead>
                    <TableHead>Estado Pago</TableHead>
                    {isAdmin && <TableHead>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inf: Infraction) => (
                    <TableRow key={inf.id as string}>
                      <TableCell className="font-medium">
                        {(inf.houses as Record<string, unknown>)?.house_number as string || "?"}
                      </TableCell>
                      <TableCell className="text-sm">{inf.infraction_date as string}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">{inf.description as string}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {inf.currency === "UF" ? `${inf.fine_amount} UF` : (inf.fine_amount ? formatCurrency(inf.fine_amount, currencySymbol) : "-")}
                      </TableCell>
                      <TableCell className="font-medium">
                        <span className={inf.currency === "UF" ? "bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs" : "bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs"}>
                          {inf.currency || "CLP"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {inf.amount_pending ? (
                          inf.currency === "UF" ? `${inf.amount_pending} UF` : formatCurrency(inf.amount_pending, currencySymbol)
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            inf.payment_status === "complete" ? "bg-green-600 text-white border-green-600 hover:bg-green-700" :
                            inf.payment_status === "partial" ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700" :
                            "bg-orange-600 text-white border-orange-600 hover:bg-orange-700"
                          }
                        >
                          {inf.payment_status === "complete" ? "Pagada" : inf.payment_status === "partial" ? "Parcial" : "Pendiente"}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="dark:bg-slate-800 dark:text-white">
                              {/* Pagar cuota for pending/partial multas */}
                              {(inf.payment_status === "pending" || inf.payment_status === "partial") && (
                                <DropdownMenuItem onClick={() => setPaymentOpen(inf.id as string)} className="dark:focus:bg-slate-700">
                                  <CheckCircle className="h-4 w-4 mr-2" />Pagar Cuota
                                </DropdownMenuItem>
                              )}
                              {/* Registrar pago completo (deprecated but keep for backward compat) */}
                              {inf.payment_status === "complete" && inf.is_paid === false && (
                                <DropdownMenuItem onClick={() => setPaymentOpen(inf.id as string)} className="dark:focus:bg-slate-700">
                                  <CheckCircle className="h-4 w-4 mr-2" />Registrar Pago
                                </DropdownMenuItem>
                              )}
                              {/* Edit option only if not paid */}
                              {inf.payment_status !== "complete" && (
                                <DropdownMenuItem onClick={() => setEditOpen(inf.id as string)} className="dark:focus:bg-slate-700">
                                  <Edit2 className="h-4 w-4 mr-2" />Editar
                                </DropdownMenuItem>
                              )}
                              {/* Delete option only if no saldo is pending */}
                              {inf.payment_status !== "complete" ? (
                                <DropdownMenuItem onClick={() => setDeleteOpen(inf.id as string)} className="text-destructive dark:focus:bg-slate-700">
                                  <Trash2 className="h-4 w-4 mr-2" />Eliminar
                                </DropdownMenuItem>
                              ) : null}
                              {inf.payment_status === "complete" ? (
                                <DropdownMenuItem disabled className="text-muted-foreground">
                                  No disponible (pagada)
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {/* Edit Dialog */}
                          <Dialog open={editOpen === inf.id} onOpenChange={(v) => !v && setEditOpen(null)}>
                            <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }} className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle style={{ color: dialogTextColor }}>Editar Infraccion</DialogTitle>
                              </DialogHeader>
                              <form
                                action={async (fd) => {
                                  fd.set("id", inf.id as string)
                                  await updateInfraction(fd)
                                  setEditOpen(null)
                                }}
                                className="flex flex-col gap-4"
                              >
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="edit_desc" style={{ color: dialogTextColor }}>Descripcion</Label>
                                  <Textarea id="edit_desc" name="description" defaultValue={inf.description as string} required minLength={3} style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex flex-col gap-2">
                                    <Label htmlFor="edit_fine" style={{ color: dialogTextColor }}>Multa ({currencySymbol})</Label>
                                    <Input id="edit_fine" name="fine_amount" type="number" step="0.01" defaultValue={Number(inf.fine_amount) || 0} min="0" style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <Label htmlFor="edit_date" style={{ color: dialogTextColor }}>Fecha</Label>
                                    <Input id="edit_date" name="infraction_date" type="date" defaultValue={inf.infraction_date as string} required style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                                  </div>
                                </div>
                                <Button type="submit" className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Guardar Cambios</Button>
                              </form>
                            </DialogContent>
                          </Dialog>

                          {/* Payment Dialog */}
                          <Dialog open={paymentOpen === inf.id} onOpenChange={(v) => {
                            if (!v && !isPending) {
                              setPaymentOpen(null)
                            }
                          }}>
                            <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }} className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle style={{ color: dialogTextColor }}>Registrar Pago de Multa</DialogTitle>
                              </DialogHeader>
                              <form
                                action={(formData) => {
                                  startTransition(async () => {
                                    try {
                                      await markInfractionPaidWithIncome(formData)
                                      setPaymentOpen(null)
                                    } catch (error) {
                                      console.error("[v0] Error en pago:", error)
                                    }
                                  })
                                }}
                                className="flex flex-col gap-4"
                              >
                                {/* Hidden inputs for IDs */}
                                <input type="hidden" name="infraction_id" value={inf.id as string} />
                                <input type="hidden" name="house_id" value={inf.house_id as string} />
                                
                                <div className="space-y-2 p-3 bg-muted rounded">
                                  <p style={{ color: dialogTextColor }}><strong>Descripción:</strong> {inf.description}</p>
                                  <p style={{ color: dialogTextColor }}><strong>Monto:</strong> {formatCurrency(inf.fine_amount, currencySymbol)}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex flex-col gap-2">
                                    <Label htmlFor="payment_date" style={{ color: dialogTextColor }}>Fecha de Pago</Label>
                                    <Input id="payment_date" name="paid_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required disabled={isPending} style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <Label htmlFor="payment_amount" style={{ color: dialogTextColor }}>Monto Recibido ({currencySymbol})</Label>
                                    <Input id="payment_amount" name="amount" type="number" step="0.01" defaultValue={Number(inf.fine_amount || 0)} min="0" required disabled={isPending} style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                                  </div>
                                </div>
                                <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50">
                                  {isPending ? "Procesando..." : "Confirmar Pago"}
                                </Button>
                              </form>
                            </DialogContent>
                          </Dialog>

                          {/* Delete Dialog */}
                          <AlertDialog open={deleteOpen === inf.id} onOpenChange={(v) => !v && setDeleteOpen(null)}>
                            <AlertDialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }}>
                              <AlertDialogHeader>
                                <AlertDialogTitle style={{ color: dialogTextColor }}>Eliminar Infraccion</AlertDialogTitle>
                                <AlertDialogDescription style={{ color: dialogTextColor }}>
                                  Esta accion no se puede deshacer. Se eliminara permanentemente esta infraccion.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="flex gap-3 justify-end">
                                <AlertDialogCancel style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}>Cancelar</AlertDialogCancel>
                                <Button
                                  onClick={() => { deleteInfraction(inf.id as string); setDeleteOpen(null) }}
                                  className="bg-red-600 text-white hover:bg-red-700"
                                >
                                  Eliminar
                                </Button>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
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
