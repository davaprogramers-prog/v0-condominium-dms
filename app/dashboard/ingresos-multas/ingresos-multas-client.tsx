"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useTheme } from "@/app/dashboard/theme-context"
import { createFineIncome, updateFineIncome, deleteFineIncome } from "@/app/dashboard/actions"
import { FormattedDate } from "@/app/dashboard/usuarios/formatted-date"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface IngresoMultasClientProps {
  incomeRecords: any[]
  houses: any[]
  totalFines: number
  paidCount: number
  month: number
  year: number
  isAdmin: boolean
  currencySymbol: string
}

export function IngresoMultasClient({
  incomeRecords,
  houses,
  totalFines,
  paidCount,
  month,
  year,
  isAdmin,
  currencySymbol,
}: IngresoMultasClientProps) {
  const [openNew, setOpenNew] = useState(false)
  const [selectedHouse, setSelectedHouse] = useState("")
  const [selectedType, setSelectedType] = useState("")
  const [editOpen, setEditOpen] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>(null)
  const [editAmount, setEditAmount] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const { inputBgColor, inputTextColor, dialogBgColor, dialogTextColor } = useTheme()

  const allFinesIncome = incomeRecords

  const handleEditClick = (item: any) => {
    setEditData(item)
    setEditAmount((item.amount || 0).toString())
    setEditDate(item.income_date || new Date().toISOString().split('T')[0])
    setEditDesc(item.description || "")
    setEditOpen(item.id)
  }

  const handleSaveEdit = async () => {
    if (!editData || !editAmount) return
    setIsUpdating(true)
    try {
      const fd = new FormData()
      fd.set("id", editData.id)
      fd.set("amount", editAmount)
      fd.set("income_date", editDate)
      fd.set("description", editDesc || "Ingreso por multa")
      await updateFineIncome(fd)
      setEditOpen(null)
      setEditData(null)
    } catch (err) {
      console.error("Error updating fine income:", err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteOpen) return
    setIsDeleting(true)
    try {
      await deleteFineIncome(deleteOpen)
      setDeleteOpen(null)
    } catch (err) {
      console.error("Error deleting fine income:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Multas Pagadas</p>
            <p className="text-2xl font-bold text-red-600">${totalFines.toLocaleString("es-CL")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Infracciones Pagadas</p>
            <p className="text-2xl font-bold text-emerald-600">{paidCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Ingresos Registrados</p>
            <p className="text-2xl font-bold">{incomeRecords.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* New Income Button */}
      {isAdmin && (
        <div className="flex justify-end">
          <Button onClick={() => setOpenNew(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Ingreso por Multa
          </Button>
        </div>
      )}

      {/* New Income Dialog */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }} className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ color: dialogTextColor }}>Registrar Ingreso por Multa</DialogTitle>
          </DialogHeader>
          <form
            action={async (fd) => {
              fd.set("period_month", month.toString())
              fd.set("period_year", year.toString())
              await createFineIncome(fd)
              setOpenNew(false)
              setSelectedHouse("")
              setSelectedType("")
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="house_select" style={{ color: dialogTextColor }}>Casa</Label>
              <Select value={selectedHouse} onValueChange={setSelectedHouse}>
                <SelectTrigger id="house_select" style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}>
                  <SelectValue placeholder="Seleccionar casa" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}>
                  {houses.map((house) => (
                    <SelectItem key={house.id} value={house.id}>
                      Casa #{house.house_number} - {house.owner_name || "Sin nombre"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="house_id" value={selectedHouse} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="type_select" style={{ color: dialogTextColor }}>Tipo de Multa</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger id="type_select" style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}>
                  <SelectItem value="Multa por estacionamiento">Multa por estacionamiento</SelectItem>
                  <SelectItem value="Intereses por mora">Intereses por mora</SelectItem>
                  <SelectItem value="Multa por ruido">Multa por ruido</SelectItem>
                  <SelectItem value="Multa por mascotas">Multa por mascotas</SelectItem>
                  <SelectItem value="Multa por uso de áreas comunes">Multa por uso de áreas comunes</SelectItem>
                  <SelectItem value="Otra multa">Otra multa</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="description" value={selectedType} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="amount" style={{ color: dialogTextColor }}>Monto ({currencySymbol})</Label>
                <Input 
                  id="amount" 
                  name="amount" 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  required
                  style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="income_date" style={{ color: dialogTextColor }}>Fecha</Label>
                <Input 
                  id="income_date" 
                  name="income_date" 
                  type="date" 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                  style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
                />
              </div>
            </div>

            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={!selectedHouse || !selectedType}>
              Registrar Ingreso
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Pagos de Multas</CardTitle>
        </CardHeader>
        <CardContent>
          {allFinesIncome.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No hay pagos de multas registrados para este mes</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Casa</TableHead>
                  <TableHead>Residente</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {allFinesIncome.map((item, idx) => {
                  const date = item.paid_date || item.income_date
                  return (
                    <TableRow key={`${item.id}-${idx}`}>
                      <TableCell>
                        <FormattedDate dateString={date} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">#{item.houses?.house_number}</Badge>
                      </TableCell>
                      <TableCell>{item.houses?.owner_name || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.description || "Pago de multa"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-600">
                        ${(item.fine_amount || item.amount || 0).toLocaleString("es-CL")}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditClick(item)}
                          >
                            Editar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteOpen(item.id)}
                          >
                            Eliminar
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editOpen} onOpenChange={(open) => !open && setEditOpen(null)}>
        <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }} className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ color: dialogTextColor }}>Editar Ingreso por Multa</DialogTitle>
          </DialogHeader>
          {editData && (
            <div className="flex flex-col gap-4">
              <div>
                <Label style={{ color: dialogTextColor }}>Casa</Label>
                <p className="text-sm opacity-75">Casa #{editData.houses?.house_number} - {editData.houses?.owner_name}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_amount" style={{ color: dialogTextColor }}>Monto ({currencySymbol})</Label>
                <Input
                  id="edit_amount"
                  type="number"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_date" style={{ color: dialogTextColor }}>Fecha</Label>
                <Input
                  id="edit_date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_desc" style={{ color: dialogTextColor }}>Descripción</Label>
                <Input
                  id="edit_desc"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Descripción de la multa"
                  style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditOpen(null)}
                  disabled={isUpdating}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleSaveEdit}
                  disabled={isUpdating || !editAmount}
                >
                  {isUpdating ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteOpen} onOpenChange={(open) => !open && setDeleteOpen(null)}>
        <AlertDialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: dialogTextColor }}>Eliminar Ingreso</AlertDialogTitle>
            <AlertDialogDescription style={{ color: dialogTextColor, opacity: 0.7 }}>
              ¿Está seguro que desea eliminar este registro de multa? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
