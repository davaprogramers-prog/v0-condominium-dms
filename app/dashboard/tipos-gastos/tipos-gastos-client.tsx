"use client"
import { useState } from "react"
import { createExpenseType, updateExpenseType, deleteExpenseType } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Tag, Edit2, Trash2 } from "lucide-react"

export function TiposGastosClient({ types, isAdmin }: { types: Record<string, unknown>[]; isAdmin: boolean }) {
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tipos de Gastos</h1>
          <p className="text-sm text-muted-foreground">Categorias para clasificar los gastos del condominio</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Nuevo Tipo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Crear Tipo de Gasto</DialogTitle></DialogHeader>
              <form action={async (fd) => { await createExpenseType(fd); setOpen(false) }} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" name="name" placeholder="Ej: Mantenimiento, Seguridad..." required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Descripcion</Label>
                  <Input id="description" name="description" placeholder="Descripcion opcional" />
                </div>
                <Button type="submit">Crear Tipo</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {types.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Tag className="h-10 w-10" />
              <p>No hay tipos de gastos creados</p>
            </CardContent>
          </Card>
        ) : types.map((type) => (
          <Card key={type.id as string}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{type.name as string}</CardTitle>
              <Badge variant={type.is_active ? "default" : "secondary"}>
                {type.is_active ? "Activo" : "Inactivo"}
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">{(type.description as string) || "Sin descripcion"}</p>
              {isAdmin && (
                <div className="flex gap-2 pt-2 border-t">
                  <Dialog open={editOpen === type.id} onOpenChange={(v) => !v && setEditOpen(null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditOpen(type.id as string)}>
                        <Edit2 className="h-4 w-4 mr-1" />Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Editar Tipo de Gasto</DialogTitle></DialogHeader>
                      <form action={async (fd) => { fd.set("id", type.id as string); fd.set("is_active", String(type.is_active)); await updateExpenseType(fd); setEditOpen(null) }} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="edit_name">Nombre</Label>
                          <Input id="edit_name" name="name" defaultValue={type.name as string} required />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="edit_desc">Descripcion</Label>
                          <Input id="edit_desc" name="description" defaultValue={(type.description as string) || ""} />
                        </div>
                        <Button type="submit">Guardar Cambios</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="flex-1">
                        <Trash2 className="h-4 w-4 mr-1" />Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Tipo de Gasto</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta accion no se puede deshacer. Se eliminara permanentemente este tipo de gasto.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="flex gap-3 justify-end">
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteExpenseType(type.id as string)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Eliminar
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
