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
import { createFineIncome } from "@/app/dashboard/actions"

interface IngresoMultasClientProps {
  finesData: any[]
  incomeRecords: any[]
  houses: any[]
  totalFines: number
  paidCount: number
  combinedTotal: number
  month: number
  year: number
  isAdmin: boolean
  currencySymbol: string
}

export function IngresoMultasClient({
  finesData,
  incomeRecords,
  houses,
  totalFines,
  paidCount,
  combinedTotal,
  month,
  year,
  isAdmin,
  currencySymbol,
}: IngresoMultasClientProps) {
  const [openNew, setOpenNew] = useState(false)
  const [selectedHouse, setSelectedHouse] = useState("")
  const { inputBgColor, inputTextColor, dialogBgColor, dialogTextColor } = useTheme()

  const allFinesIncome = [...finesData, ...incomeRecords]

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Multas Pagadas</p>
            <p className="text-2xl font-bold text-red-600">${combinedTotal.toLocaleString("es-CL")}</p>
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
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="house_select" style={{ color: dialogTextColor }}>Casa</Label>
              <Select value={selectedHouse} onValueChange={setSelectedHouse}>
                <SelectTrigger id="house_select" style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}>
                  <SelectValue placeholder="Seleccionar casa" />
                </SelectTrigger>
                <SelectContent>
                  {houses.map((house) => (
                    <SelectItem key={house.id} value={house.id}>
                      Casa #{house.house_number} - {house.owner_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="house_id" value={selectedHouse} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description" style={{ color: dialogTextColor }}>Descripción de la Multa</Label>
              <Select name="description">
                <SelectTrigger id="description" style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Multa por estacionamiento">Multa por estacionamiento</SelectItem>
                  <SelectItem value="Intereses por mora">Intereses por mora</SelectItem>
                  <SelectItem value="Multa por ruido">Multa por ruido</SelectItem>
                  <SelectItem value="Multa por mascotas">Multa por mascotas</SelectItem>
                  <SelectItem value="Multa por uso de áreas comunes">Multa por uso de áreas comunes</SelectItem>
                  <SelectItem value="Otra multa">Otra multa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="custom_description" style={{ color: dialogTextColor }}>Descripción personalizada (opcional)</Label>
              <Textarea 
                id="custom_description" 
                name="custom_description" 
                placeholder="Detalles adicionales..."
                style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
                rows={2}
              />
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

            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={!selectedHouse}>
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
                  <TableHead>Descripcion</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allFinesIncome.map((item, idx) => {
                  const date = item.paid_date || item.income_date
                  return (
                    <TableRow key={`${item.id}-${idx}`}>
                      <TableCell>
                        {new Date(date).toLocaleDateString("es-CL")}
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
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}
