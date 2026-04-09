"use client"

import { useState } from "react"
import { createCommonArea, updateCommonArea, deleteCommonArea } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { FileUpload } from "@/components/file-upload"
import { Plus, MapPin, Wrench, DollarSign, Edit2, Trash2 } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface AreasComunesClientProps {
  areas: Record<string, unknown>[]
  currencySymbol: string
  isAdmin: boolean
}

export function AreasComunesClient({ areas, currencySymbol, isAdmin }: AreasComunesClientProps) {
  const [openNew, setOpenNew] = useState(false)
  const [openEdit, setOpenEdit] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState("")
  const [editPhotoUrl, setEditPhotoUrl] = useState("")
  const [isPaid, setIsPaid] = useState(false)
  const [editIsPaid, setEditIsPaid] = useState(false)

  const handleEditClick = (area: Record<string, unknown>) => {
    setEditPhotoUrl((area.photo_url as string) || "")
    setEditIsPaid((area.is_paid as boolean) || false)
    setOpenEdit(area.id as string)
  }

  const handleDeleteClick = async (id: string) => {
    try {
      await deleteCommonArea(id)
    } catch (error) {
      console.error("[v0] Delete error:", error)
    }
  }

  const handleEditSubmit = async (fd: FormData, areaId: string) => {
    try {
      fd.set("id", areaId)
      fd.set("photo_url", editPhotoUrl)
      fd.set("is_paid", editIsPaid.toString())
      await updateCommonArea(fd)
      setOpenEdit(null)
    } catch (error) {
      console.error("[v0] Update error:", error)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Areas Comunes</h1>
          <p className="text-sm text-muted-foreground">{areas.length} areas registradas</p>
        </div>
        {isAdmin && (
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button className="bg-slate-700 hover:bg-slate-800 text-white"><Plus className="mr-2 h-4 w-4" />Nueva Área</Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
              <DialogHeader><DialogTitle className="text-slate-900 dark:text-white">Registrar Área Común</DialogTitle></DialogHeader>
              <form
                action={async (fd) => {
                  fd.set("photo_url", photoUrl)
                  fd.set("is_paid", isPaid.toString())
                  await createCommonArea(fd)
                  setOpenNew(false)
                  setPhotoUrl("")
                  setIsPaid(false)
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="area_name" className="text-slate-900 dark:text-slate-200">Nombre</Label>
                  <Input id="area_name" name="name" placeholder="Ej: Piscina, Salon multiuso..." required className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="area_desc" className="text-slate-900 dark:text-slate-200">Descripción</Label>
                  <Textarea id="area_desc" name="description" placeholder="Descripcion del area..." className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-slate-900 dark:text-slate-200">Foto</Label>
                  <FileUpload bucket="projects" folder="areas" onUpload={setPhotoUrl} label="Subir foto" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch id="is_paid_area" checked={isPaid} onCheckedChange={setIsPaid} />
                    <Label htmlFor="is_paid_area" className="text-slate-900 dark:text-slate-200">Uso pagado</Label>
                  </div>
                  <Badge className="bg-white text-slate-900 border border-slate-300 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-200 font-semibold">
                    {isPaid ? "Pagado" : "Gratis"}
                  </Badge>
                </div>
                {isPaid && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="usage_fee" className="text-slate-900 dark:text-slate-200">Tarifa de uso ({currencySymbol})</Label>
                    <Input id="usage_fee" name="usage_fee" type="number" step="0.01" placeholder="0.00" className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="maintenance_responsible" className="text-slate-900 dark:text-slate-200">Responsable de mantenimiento</Label>
                  <Input id="maintenance_responsible" name="maintenance_responsible" placeholder="Persona o empresa" className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                </div>
                <Button type="submit" className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Guardar Área</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {areas.length === 0 ? (
        <div className="rounded-lg border-2 border-slate-600 bg-slate-700 dark:bg-slate-800 p-12 text-center text-slate-300">
          <MapPin className="h-10 w-10 mx-auto mb-2" />
          <p>No hay areas comunes registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {areas.map((area) => (
            <div key={area.id as string} className="rounded-lg border-2 border-slate-600 bg-slate-700 dark:bg-slate-800 p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-4">
                {/* Foto del área */}
                {area.photo_url ? (
                  <div className="aspect-video overflow-hidden rounded-lg">
                    <img
                      src={area.photo_url as string}
                      alt={area.name as string}
                      className="h-full w-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                ) : null}

                {/* Nombre y estado */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-300">Área</p>
                    <h3 className="text-xl font-bold text-white">{area.name as string}</h3>
                  </div>
                  <Badge variant={area.is_paid ? "default" : "secondary"} className="text-xs bg-green-600 text-white dark:bg-green-700 dark:text-white">
                    {area.is_paid ? "Pagado" : "Gratis"}
                  </Badge>
                </div>

                {/* Descripción */}
                {area.description ? 
                  <p className="text-sm text-slate-200">{area.description as string}</p> 
                : null}

                {/* Información de tarifa */}
                {area.is_paid && area.usage_fee ? (
                  <div className="flex items-center gap-2 text-slate-200">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Tarifa: {currencySymbol}{Number(area.usage_fee).toLocaleString()}</span>
                  </div>
                ) : null}

                {/* Responsable de mantenimiento */}
                {area.maintenance_responsible ? (
                  <div className="flex items-center gap-2 text-slate-200">
                    <Wrench className="h-4 w-4" />
                    <span className="text-sm">Mant.: {area.maintenance_responsible as string}</span>
                  </div>
                ) : null}

                {/* Botones de acciones */}
                {isAdmin && (
                  <div className="flex gap-2 pt-3 border-t border-slate-600">
                    <Dialog open={openEdit === area.id} onOpenChange={(open) => !open && setOpenEdit(null)}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="flex-1 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300"
                          onClick={() => handleEditClick(area)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" style={{ color: "#64748b" }} />
                          Editar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
                        <DialogHeader><DialogTitle className="text-slate-900 dark:text-white">Editar Área Común</DialogTitle></DialogHeader>
                        <form
                          action={async (fd) => {
                            await handleEditSubmit(fd, area.id as string)
                          }}
                          className="flex flex-col gap-4"
                        >
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="edit_name" className="text-slate-900 dark:text-slate-200">Nombre</Label>
                            <Input
                              id="edit_name"
                              name="name"
                              defaultValue={area.name as string}
                              required
                              className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="edit_desc" className="text-slate-900 dark:text-slate-200">Descripción</Label>
                            <Textarea
                              id="edit_desc"
                              name="description"
                              defaultValue={(area.description as string) || ""}
                              className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label className="text-slate-900 dark:text-slate-200">Foto</Label>
                            <FileUpload
                              bucket="projects"
                              folder="areas"
                              onUpload={setEditPhotoUrl}
                              label="Cambiar foto"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Switch
                                id="edit_is_paid"
                                checked={editIsPaid}
                                onCheckedChange={setEditIsPaid}
                              />
                              <Label htmlFor="edit_is_paid" className="text-slate-900 dark:text-slate-200">Uso pagado</Label>
                            </div>
                            <Badge className="bg-white text-slate-900 border border-slate-300 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-200 font-semibold">
                              {editIsPaid ? "Pagado" : "Gratis"}
                            </Badge>
                          </div>
                          {editIsPaid && (
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="edit_usage_fee" className="text-slate-900 dark:text-slate-200">Tarifa de uso ({currencySymbol})</Label>
                              <Input
                                id="edit_usage_fee"
                                name="usage_fee"
                                type="number"
                                step="0.01"
                                defaultValue={(area.usage_fee as number) || 0}
                                className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                              />
                            </div>
                          )}
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="edit_maintenance" className="text-slate-900 dark:text-slate-200">Responsable de mantenimiento</Label>
                            <Input
                              id="edit_maintenance"
                              name="maintenance_responsible"
                              defaultValue={(area.maintenance_responsible as string) || ""}
                              className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                            />
                          </div>
                          <Button type="submit" className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Guardar Cambios</Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" className="flex-1 bg-destructive hover:bg-destructive/90 text-white">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-slate-900 dark:text-white">Eliminar Área Común</AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
                            {"¿Estás seguro de que deseas eliminar \"" + (area.name as string) + "\"? Esta acción no puede deshacerse."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex gap-3 justify-end">
                          <AlertDialogCancel className="text-slate-900 dark:text-white">Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteClick(area.id as string)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
