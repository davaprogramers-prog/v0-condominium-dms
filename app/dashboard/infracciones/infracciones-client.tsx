"use client"

import { useState } from "react"
import { createInfraction, markInfractionPaid, updateInfraction, deleteInfraction } from "@/app/dashboard/actions"
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
import { Plus, AlertTriangle, CheckCircle, MoreHorizontal, Edit2, Trash2 } from "lucide-react"
import { useTheme } from "@/app/dashboard/theme-context"

interface InfraccionesClientProps {
  infractions: Record<string, unknown>[]
  houses: Record<string, unknown>[]
  currencySymbol: string
  isAdmin: boolean
}

export function InfraccionesClient({ infractions, houses, currencySymbol, isAdmin }: InfraccionesClientProps) {
  const [openNew, setOpenNew] = useState(false)
  const [selectedHouse, setSelectedHouse] = useState("")
  const [filter, setFilter] = useState("todas")
  const [editOpen, setEditOpen] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState<string | null>(null)
  const { inputBgColor, inputTextColor } = useTheme()

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Infracciones</h1>
          <p className="text-sm text-muted-foreground">{pendingCount} pendientes, {paidCount} pagadas</p>
        </div>
        {isAdmin && (
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button className="bg-slate-700 hover:bg-slate-800 text-white"><Plus className="mr-2 h-4 w-4" />Nueva Infraccion</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-slate-900 dark:text-white">Registrar Infraccion</DialogTitle>
              </DialogHeader>
              <form
                action={async (fd) => {
                  fd.set("house_id", selectedHouse)
                  await createInfraction(fd)
                  setOpenNew(false)
                  setSelectedHouse("")
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label className="text-slate-900 dark:text-slate-200">Casa</Label>
                  <Select value={selectedHouse} onValueChange={setSelectedHouse}>
                    <SelectTrigger style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}><SelectValue placeholder="Seleccionar casa" /></SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:text-white">
                      {houses.map((h) => (
                        <SelectItem key={h.id as string} value={h.id as string}>{h.house_number as string}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="inf_desc" className="text-slate-900 dark:text-slate-200">Descripcion</Label>
                  <Textarea id="inf_desc" name="description" placeholder="Detalle de la infraccion..." required style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="fine_amount" className="text-slate-900 dark:text-slate-200">Multa ({currencySymbol})</Label>
                    <Input id="fine_amount" name="fine_amount" type="number" step="0.01" placeholder="0.00" style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="inf_date" className="text-slate-900 dark:text-slate-200">Fecha</Label>
                    <Input id="inf_date" name="infraction_date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="inf_notes" className="text-slate-900 dark:text-slate-200">Notas</Label>
                  <Textarea id="inf_notes" name="notes" placeholder="Notas adicionales..." style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                </div>
                <Button type="submit" disabled={!selectedHouse} className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Registrar Infraccion</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Multas</p>
            <p className="text-2xl font-bold">{currencySymbol}{totalFines.toLocaleString()}</p>
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
              <SelectTrigger className="w-36 border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <SelectItem value="todas" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-700">Todas</SelectItem>
                <SelectItem value="pendientes" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-700">Pendientes</SelectItem>
                <SelectItem value="pagadas" className="text-slate-900 dark:text-white focus:bg-slate-100 dark:focus:bg-slate-700">Pagadas</SelectItem>
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
                    <TableHead>Estado</TableHead>
                    {isAdmin && <TableHead>Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inf) => (
                    <TableRow key={inf.id as string}>
                      <TableCell className="font-medium">
                        {(inf.houses as Record<string, unknown>)?.house_number as string || "?"}
                      </TableCell>
                      <TableCell className="text-sm">{inf.infraction_date as string}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">{inf.description as string}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {inf.fine_amount ? `${currencySymbol}${Number(inf.fine_amount).toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={inf.is_paid 
                            ? "bg-green-600 text-white border-green-600 hover:bg-green-700" 
                            : "bg-orange-600 text-white border-orange-600 hover:bg-orange-700"
                          }
                        >
                          {inf.is_paid ? "Pagada" : "Pendiente"}
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
                              {!inf.is_paid && (
                                <DropdownMenuItem onClick={() => markInfractionPaid(inf.id as string)} className="dark:focus:bg-slate-700">
                                  <CheckCircle className="h-4 w-4 mr-2" />Marcar pagada
                                </DropdownMenuItem>
                              )}
                              {!inf.is_paid && (
                                <DropdownMenuItem onClick={() => setEditOpen(inf.id as string)} className="dark:focus:bg-slate-700">
                                  <Edit2 className="h-4 w-4 mr-2" />Editar
                                </DropdownMenuItem>
                              )}
                              {!inf.is_paid ? (
                                <DropdownMenuItem onClick={() => setDeleteOpen(inf.id as string)} className="text-destructive dark:focus:bg-slate-700">
                                  <Trash2 className="h-4 w-4 mr-2" />Eliminar
                                </DropdownMenuItem>
                              ) : null}
                              {inf.is_paid ? (
                                <DropdownMenuItem disabled className="text-muted-foreground">
                                  No disponible (pagada)
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {/* Edit Dialog */}
                          <Dialog open={editOpen === inf.id} onOpenChange={(v) => !v && setEditOpen(null)}>
                            <DialogContent className="max-w-lg bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
                              <DialogHeader>
                                <DialogTitle className="text-slate-900 dark:text-white">Editar Infraccion</DialogTitle>
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
                                  <Label htmlFor="edit_desc" className="text-slate-900 dark:text-slate-200">Descripcion</Label>
                                  <Textarea id="edit_desc" name="description" defaultValue={inf.description as string} required style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex flex-col gap-2">
                                    <Label htmlFor="edit_fine" className="text-slate-900 dark:text-slate-200">Multa ({currencySymbol})</Label>
                                    <Input id="edit_fine" name="fine_amount" type="number" step="0.01" defaultValue={Number(inf.fine_amount) || 0} style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <Label htmlFor="edit_date" className="text-slate-900 dark:text-slate-200">Fecha</Label>
                                    <Input id="edit_date" name="infraction_date" type="date" defaultValue={inf.infraction_date as string} required style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="edit_notes" className="text-slate-900 dark:text-slate-200">Notas</Label>
                                  <Textarea id="edit_notes" name="notes" defaultValue={(inf.notes as string) || ""} style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                                </div>
                                <Button type="submit" className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Guardar Cambios</Button>
                              </form>
                            </DialogContent>
                          </Dialog>

                          {/* Delete Dialog */}
                          <AlertDialog open={deleteOpen === inf.id} onOpenChange={(v) => !v && setDeleteOpen(null)}>
                            <AlertDialogContent className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-slate-900 dark:text-white">Eliminar Infraccion</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
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
