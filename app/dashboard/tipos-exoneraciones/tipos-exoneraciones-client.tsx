"use client"

import { useState } from "react"
import { createExemptionType, updateExemptionType, deleteExemptionType } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, ShieldOff, Edit2, Trash2 } from "lucide-react"

interface TiposExoneracionesClientProps {
  exemptionTypes: Record<string, unknown>[]
  isAdmin: boolean
}

export function TiposExoneracionesClient({ exemptionTypes, isAdmin }: TiposExoneracionesClientProps) {
  const [openNew, setOpenNew] = useState(false)
  const [editOpen, setEditOpen] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tipos de Exoneraciones</h1>
          <p className="text-sm text-muted-foreground">{exemptionTypes.length} tipos registrados</p>
        </div>
        {isAdmin && (
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Nuevo Tipo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Crear Tipo de Exoneracion</DialogTitle></DialogHeader>
              <form
                action={async (fd) => {
                  await createExemptionType(fd)
                  setOpenNew(false)
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Ej: Desempleo, Adulto Mayor, Persona con Discapacidad..."
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Descripcion</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Criterios y detalles de esta exoneracion..."
                  />
                </div>
                <Button type="submit">Guardar Tipo</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {exemptionTypes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <ShieldOff className="h-10 w-10" />
            <p>No hay tipos de exoneraciones registradas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {exemptionTypes.map((type) => (
            <Card key={type.id as string}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldOff className="h-5 w-5" />
                  {type.name as string}
                </CardTitle>
                {type.description ? <CardDescription>{type.description as string}</CardDescription> : null}
              </CardHeader>
              {isAdmin ? (
                <CardContent className="flex gap-2 pt-0">
                  <Dialog open={editOpen === type.id} onOpenChange={(v) => !v && setEditOpen(null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setEditOpen(type.id as string)}>
                        <Edit2 className="h-4 w-4 mr-1" />Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Editar Tipo de Exoneracion</DialogTitle></DialogHeader>
                      <form
                        action={async (fd) => {
                          fd.set("id", type.id as string)
                          await updateExemptionType(fd)
                          setEditOpen(null)
                        }}
                        className="flex flex-col gap-4"
                      >
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="edit_name">Nombre</Label>
                          <Input id="edit_name" name="name" defaultValue={type.name as string} required />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="edit_desc">Descripcion</Label>
                          <Textarea id="edit_desc" name="description" defaultValue={(type.description as string) || ""} />
                        </div>
                        <Button type="submit">Guardar Cambios</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Tipo de Exoneracion</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta accion no se puede deshacer. Se eliminara permanentemente este tipo.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="flex gap-3 justify-end">
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteExemptionType(type.id as string)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Eliminar
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
