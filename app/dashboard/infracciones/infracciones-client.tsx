"use client"

import { useState } from "react"
import { createInfraction, markInfractionPaid } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Plus, AlertTriangle, CheckCircle } from "lucide-react"

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
              <Button><Plus className="mr-2 h-4 w-4" />Nueva Infraccion</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Infraccion</DialogTitle></DialogHeader>
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
                  <Label>Casa</Label>
                  <Select value={selectedHouse} onValueChange={setSelectedHouse}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar casa" /></SelectTrigger>
                    <SelectContent>
                      {houses.map((h) => (
                        <SelectItem key={h.id as string} value={h.id as string}>{h.house_number as string}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="inf_desc">Descripcion</Label>
                  <Textarea id="inf_desc" name="description" placeholder="Detalle de la infraccion..." required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="fine_amount">Multa ({currencySymbol})</Label>
                    <Input id="fine_amount" name="fine_amount" type="number" step="0.01" placeholder="0.00" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="inf_date">Fecha</Label>
                    <Input id="inf_date" name="infraction_date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="inf_notes">Notas</Label>
                  <Textarea id="inf_notes" name="notes" placeholder="Notas adicionales..." />
                </div>
                <Button type="submit" disabled={!selectedHouse}>Registrar Infraccion</Button>
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
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
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
                        <Badge variant={inf.is_paid ? "default" : "destructive"}>
                          {inf.is_paid ? "Pagada" : "Pendiente"}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          {!inf.is_paid && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markInfractionPaid(inf.id as string)}
                              className="gap-1"
                            >
                              <CheckCircle className="h-3 w-3" />Marcar pagada
                            </Button>
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
