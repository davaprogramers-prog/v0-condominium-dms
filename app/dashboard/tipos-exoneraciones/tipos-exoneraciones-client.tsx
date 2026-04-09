"use client"

import { useState } from "react"
import { createExemptionType, updateExemptionType, deleteExemptionType } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
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
          <p className="text-sm text-slate-600 dark:text-slate-400">{exemptionTypes.length} tipos registrados</p>
        </div>
        {isAdmin && (
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button className="bg-slate-700 hover:bg-slate-800 text-white"><Plus className="mr-2 h-4 w-4" />Nuevo Tipo</Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
              <DialogHeader><DialogTitle className="text-slate-900 dark:text-white">Crear Tipo de Exoneracion</DialogTitle></DialogHeader>
              <form
                action={async (fd) => {
                  await createExemptionType(fd)
                  setOpenNew(false)
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name" className="text-slate-900 dark:text-slate-200">Nombre</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Ej: Desempleo, Adulto Mayor, Persona con Discapacidad..."
                    required
                    className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description" className="text-slate-900 dark:text-slate-200">Descripcion</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Criterios y detalles de esta exoneracion..."
                    className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <Button type="submit" className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Guardar Tipo</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {exemptionTypes.length === 0 ? (
        <div className="rounded-lg border-2 border-slate-600 bg-slate-700 dark:bg-slate-800 p-12 text-center text-slate-300">
          <ShieldOff className="h-10 w-10 mx-auto mb-2" />
          <p>No hay tipos de exoneraciones registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {exemptionTypes.map((type) => (
            <div key={type.id as string} className="rounded-lg border-2 border-slate-600 bg-slate-700 dark:bg-slate-800 p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <ShieldOff className="h-5 w-5 text-slate-300 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{type.name as string}</h3>
                    {type.description ? <p className="text-sm text-slate-200 mt-1">{type.description as string}</p> : null}
                  </div>
                </div>
                {isAdmin ? (
                  <div className="flex gap-2 pt-3 border-t border-slate-600">
                    <Dialog open={editOpen === type.id} onOpenChange={(v) => !v && setEditOpen(null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="flex-1 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300" onClick={() => setEditOpen(type.id as string)}>
                          <Edit2 className="h-4 w-4 mr-1" style={{ color: "#64748b" }} />Editar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
                        <DialogHeader><DialogTitle className="text-slate-900 dark:text-white">Editar Tipo de Exoneracion</DialogTitle></DialogHeader>
                        <form
                          action={async (fd) => {
                            fd.set("id", type.id as string)
                            await updateExemptionType(fd)
                            setEditOpen(null)
                          }}
                          className="flex flex-col gap-4"
                        >
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="edit_name" className="text-slate-900 dark:text-slate-200">Nombre</Label>
                            <Input id="edit_name" name="name" defaultValue={type.name as string} required className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="edit_desc" className="text-slate-900 dark:text-slate-200">Descripcion</Label>
                            <Textarea id="edit_desc" name="description" defaultValue={(type.description as string) || ""} className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                          </div>
                          <Button type="submit" className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Guardar Cambios</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" className="flex-1 bg-destructive hover:bg-destructive/90 text-white">
                          <Trash2 className="h-4 w-4 mr-1" />Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-slate-900 dark:text-white">Eliminar Tipo de Exoneracion</AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                            Esta accion no se puede deshacer. Se eliminara permanentemente este tipo.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex gap-3 justify-end">
                          <AlertDialogCancel className="text-slate-900 dark:text-white">Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteExemptionType(type.id as string)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
