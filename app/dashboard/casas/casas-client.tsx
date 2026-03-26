"use client"

import { useState } from "react"
import { createHouse, updateHouse } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Home, Pencil } from "lucide-react"

interface CasasClientProps {
  houses: Record<string, unknown>[]
  isAdmin: boolean
  currencySymbol: string
}

export function CasasClient({ houses, isAdmin, currencySymbol }: CasasClientProps) {
  const [open, setOpen] = useState(false)
  const [editHouse, setEditHouse] = useState<Record<string, unknown> | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Casas</h1>
          <p className="text-sm text-muted-foreground">
            {houses.length} casas registradas
          </p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Nueva Casa</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Casa</DialogTitle>
              </DialogHeader>
              <form
                action={async (fd) => {
                  await createHouse(fd)
                  setOpen(false)
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="house_number">Numero de Casa</Label>
                  <Input id="house_number" name="house_number" placeholder="Ej: A-101, Casa 5..." required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="owner_name">Nombre del Propietario</Label>
                  <Input id="owner_name" name="owner_name" placeholder="Nombre completo" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="owner_email">Email del Propietario</Label>
                  <Input id="owner_email" name="owner_email" type="email" placeholder="correo@ejemplo.com" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="payment_due_day">Día de vencimiento de pago</Label>
                  <Input id="payment_due_day" name="payment_due_day" type="number" min={1} max={28} placeholder="5" defaultValue={5} />
                  <p className="text-xs text-muted-foreground">Día del mes para vencimiento (1-28)</p>
                </div>
                <Button type="submit">Guardar Casa</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {editHouse && (
        <Dialog open={!!editHouse} onOpenChange={() => setEditHouse(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Casa {editHouse.house_number as string}</DialogTitle>
            </DialogHeader>
            <form
              action={async (fd) => {
                fd.set("id", editHouse.id as string)
                await updateHouse(fd)
                setEditHouse(null)
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_owner_name">Nombre del Propietario</Label>
                <Input id="edit_owner_name" name="owner_name" defaultValue={(editHouse.owner_name as string) || ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_owner_email">Email del Propietario</Label>
                <Input id="edit_owner_email" name="owner_email" type="email" defaultValue={(editHouse.owner_email as string) || ""} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_due_day">Día de vencimiento</Label>
                <Input id="edit_due_day" name="payment_due_day" type="number" min={1} max={28} defaultValue={(editHouse.payment_due_day as number) || 5} />
                <p className="text-xs text-muted-foreground">Día del mes para vencimiento (1-28)</p>
              </div>
              <Button type="submit">Actualizar</Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listado de Casas</CardTitle>
          <CardDescription>{houses.length} unidades en total</CardDescription>
        </CardHeader>
        <CardContent>
          {houses.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Home className="h-10 w-10" />
              <p>No hay casas registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero</TableHead>
                    <TableHead>Propietario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    {isAdmin && <TableHead className="w-12" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {houses.map((house) => (
                    <TableRow key={house.id as string}>
                      <TableCell className="font-medium">{house.house_number as string}</TableCell>
                      <TableCell>{(house.owner_name as string) || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{(house.owner_email as string) || "-"}</TableCell>
                      <TableCell>
                        {house.payment_due_day ? `Día ${house.payment_due_day}` : "Día 5"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={house.is_active !== false ? "default" : "secondary"}>
                          {house.is_active !== false ? "Activa" : "Inactiva"}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => setEditHouse(house)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
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
