"use client"

import { useState } from "react"
import { createCommonArea, updateCommonArea, deleteCommonArea } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

  const handleEditClick = (area: Record<string, unknown>) => {
    setEditPhotoUrl((area.photo_url as string) || "")
    setOpenEdit(area.id as string)
  }

  const handleDeleteClick = async (id: string) => {
    try {
      await deleteCommonArea(id)
    } catch (error) {
      console.error("[v0] Delete error:", error)
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
              <Button><Plus className="mr-2 h-4 w-4" />Nueva Area</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Area Comun</DialogTitle></DialogHeader>
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
                  <Label htmlFor="area_name">Nombre</Label>
                  <Input id="area_name" name="name" placeholder="Ej: Piscina, Salon multiuso..." required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="area_desc">Descripcion</Label>
                  <Textarea id="area_desc" name="description" placeholder="Descripcion del area..." />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Foto</Label>
                  <FileUpload bucket="projects" folder="areas" onUpload={setPhotoUrl} label="Subir foto" />
                </div>
                <div className="flex items-center gap-3">
                  <Switch id="is_paid_area" checked={isPaid} onCheckedChange={setIsPaid} />
                  <Label htmlFor="is_paid_area">Uso pagado</Label>
                </div>
                {isPaid && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="usage_fee">Tarifa de uso ({currencySymbol})</Label>
                    <Input id="usage_fee" name="usage_fee" type="number" step="0.01" placeholder="0.00" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="maintenance_responsible">Responsable de mantenimiento</Label>
                  <Input id="maintenance_responsible" name="maintenance_responsible" placeholder="Persona o empresa" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="maintenance_notes">Notas de mantenimiento</Label>
                  <Textarea id="maintenance_notes" name="maintenance_notes" placeholder="Detalles del mantenimiento..." />
                </div>
                <Button type="submit">Guardar Area</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {areas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <MapPin className="h-10 w-10" />
            <p>No hay areas comunes registradas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <Card key={area.id as string}>
              {area.photo_url && (
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <img
                    src={area.photo_url as string}
                    alt={area.name as string}
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{area.name as string}</CardTitle>
                  <Badge variant={area.is_paid ? "default" : "secondary"}>
                    {area.is_paid ? "Pagado" : "Gratis"}
                  </Badge>
                </div>
                {area.description && <CardDescription>{area.description as string}</CardDescription>}
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                {area.is_paid && area.usage_fee && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>Tarifa: {currencySymbol}{Number(area.usage_fee).toLocaleString()}</span>
                  </div>
                )}
                {area.maintenance_responsible && (
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <span>Mantenimiento: {area.maintenance_responsible as string}</span>
                  </div>
                )}
                {area.maintenance_notes && (
                  <p className="text-xs text-muted-foreground">{area.maintenance_notes as string}</p>
                )}

                {isAdmin && (
                  <div className="mt-3 flex gap-2 pt-3 border-t">
                    <Dialog open={openEdit === area.id} onOpenChange={(open) => !open && setOpenEdit(null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditClick(area)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Editar Area Comun</DialogTitle></DialogHeader>
                        <form
                          action={async (fd) => {
                            fd.set("id", area.id as string)
                            fd.set("photo_url", editPhotoUrl)
                            fd.set("is_paid", (fd.get("is_paid_area") === "on").toString())
                            await updateCommonArea(fd)
                            setOpenEdit(null)
                          }}
                          className="flex flex-col gap-4"
                        >
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="edit_name">Nombre</Label>
                            <Input
                              id="edit_name"
                              name="name"
                              defaultValue={area.name as string}
                              required
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="edit_desc">Descripcion</Label>
                            <Textarea
                              id="edit_desc"
                              name="description"
                              defaultValue={(area.description as string) || ""}
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label>Foto</Label>
                            <FileUpload
                              bucket="projects"
                              folder="areas"
                              onUpload={setEditPhotoUrl}
                              label="Cambiar foto"
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch
                              id="edit_is_paid"
                              name="is_paid_area"
                              defaultChecked={area.is_paid as boolean}
                            />
                            <Label htmlFor="edit_is_paid">Uso pagado</Label>
                          </div>
                          {area.is_paid && (
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="edit_usage_fee">Tarifa de uso ({currencySymbol})</Label>
                              <Input
                                id="edit_usage_fee"
                                name="usage_fee"
                                type="number"
                                step="0.01"
                                defaultValue={(area.usage_fee as number) || 0}
                              />
                            </div>
                          )}
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="edit_maintenance">Responsable de mantenimiento</Label>
                            <Input
                              id="edit_maintenance"
                              name="maintenance_responsible"
                              defaultValue={(area.maintenance_responsible as string) || ""}
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="edit_notes">Notas de mantenimiento</Label>
                            <Textarea
                              id="edit_notes"
                              name="maintenance_notes"
                              defaultValue={(area.maintenance_notes as string) || ""}
                            />
                          </div>
                          <Button type="submit">Guardar Cambios</Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="flex-1">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar Area Comun</AlertDialogTitle>
                          <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar "{area.name}"? Esta acción no puede deshacerse.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex gap-3 justify-end">
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
