"use client"

import { useState } from "react"
import { createExemptionType, updateExemptionType, deleteExemptionType } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, ShieldOff, Edit2, Trash2, EyeOff } from "lucide-react"
import { useTheme } from "@/app/dashboard/theme-context"

interface TiposExoneracionesClientProps {
  exemptionTypes: Record<string, unknown>[]
  isAdmin: boolean
}

export function TiposExoneracionesClient({ exemptionTypes, isAdmin }: TiposExoneracionesClientProps) {
  const [openNew, setOpenNew] = useState(false)
  const [editOpen, setEditOpen] = useState<string | null>(null)
  const { cardBgColor, cardTextColor, dialogBgColor, dialogTextColor, inputBgColor, inputTextColor } = useTheme()

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground text-sm">{exemptionTypes.length} tipos registrados</p>

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
                <EyeOff className="h-5 w-5" />
                Nuevo Tipo de Exoneraciones
              </Button>

            </DialogTrigger>
            <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }}>
              <DialogHeader><DialogTitle style={{ color: dialogTextColor }}>Crear Tipo de Exoneracion</DialogTitle></DialogHeader>
              <form
                action={async (fd) => {
                  await createExemptionType(fd)
                  setOpenNew(false)
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name" style={{ color: dialogTextColor }}>Nombre</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Ej: Desempleo, Adulto Mayor, Persona con Discapacidad..."
                    required
                    style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description" style={{ color: dialogTextColor }}>Descripcion</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Criterios y detalles de esta exoneracion..."
                    style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
                  />
                </div>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Guardar Tipo</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {exemptionTypes.length === 0 ? (
        <div className="rounded-lg border-2 p-12 text-center" style={{ backgroundColor: cardBgColor, color: cardTextColor, borderColor: cardTextColor }}>
          <ShieldOff className="h-10 w-10 mx-auto mb-2" />
          <p>No hay tipos de exoneraciones registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {exemptionTypes.map((type) => (
            <div key={type.id as string} className="rounded-lg border-2 p-4 hover:shadow-md transition-shadow" style={{ backgroundColor: cardBgColor, color: cardTextColor, borderColor: cardTextColor }}>
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <ShieldOff className="h-5 w-5 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{type.name as string}</h3>
                    {type.description ? <p className="text-sm mt-1" style={{ opacity: 0.8 }}>{type.description as string}</p> : null}
                  </div>
                </div>
                {isAdmin ? (
                  <div className="flex gap-2 pt-3" style={{ borderTop: `1px solid ${cardTextColor}` }}>
                    <Dialog open={editOpen === type.id} onOpenChange={(v) => !v && setEditOpen(null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="flex-1" style={{ backgroundColor: cardBgColor === "#1e293b" ? "#f1f5f9" : "#1e293b", color: cardBgColor === "#1e293b" ? "#1e293b" : "#f1f5f9" }} onClick={() => setEditOpen(type.id as string)}>
                          <Edit2 className="h-4 w-4 mr-1" />Editar
                        </Button>
                      </DialogTrigger>
                      <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }}>
                        <DialogHeader><DialogTitle style={{ color: dialogTextColor }}>Editar Tipo de Exoneracion</DialogTitle></DialogHeader>
                        <form
                          action={async (fd) => {
                            fd.set("id", type.id as string)
                            await updateExemptionType(fd)
                            setEditOpen(null)
                          }}
                          className="flex flex-col gap-4"
                        >
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="edit_name" style={{ color: dialogTextColor }}>Nombre</Label>
                            <Input id="edit_name" name="name" defaultValue={type.name as string} required style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="edit_desc" style={{ color: dialogTextColor }}>Descripcion</Label>
                            <Textarea id="edit_desc" name="description" defaultValue={(type.description as string) || ""} style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                          </div>
                          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Guardar Cambios</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" className="flex-1 bg-destructive hover:bg-destructive/90 text-white">
                          <Trash2 className="h-4 w-4 mr-1" />Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }}>
                        <AlertDialogHeader>
                          <AlertDialogTitle style={{ color: dialogTextColor }}>Eliminar Tipo de Exoneracion</AlertDialogTitle>
                          <AlertDialogDescription style={{ color: dialogTextColor, opacity: 0.7 }}>
                            Esta accion no se puede deshacer. Se eliminara permanentemente este tipo.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex gap-3 justify-end">
                          <AlertDialogCancel style={{ color: dialogTextColor }}>Cancelar</AlertDialogCancel>
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
