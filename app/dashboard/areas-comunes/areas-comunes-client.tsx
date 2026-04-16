"use client"

import { useState } from "react"
import { createCommonArea, updateCommonArea, deleteCommonArea } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { FileUpload } from "@/components/file-upload"
import { Plus, MapPin, Wrench, DollarSign, Edit2, Trash2, AreaChart, Popsicle, PlusCircle, MapPlus, Clock, Calendar } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useTheme } from "@/app/dashboard/theme-context"
import { Area } from "recharts"

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
  const [isReservable, setIsReservable] = useState(true)
  const [editIsReservable, setEditIsReservable] = useState(true)
  const { dialogBgColor, dialogTextColor, inputBgColor, inputTextColor, cardBgColor, cardTextColor } = useTheme()

  const handleEditClick = (area: Record<string, unknown>) => {
    setEditPhotoUrl((area.photo_url as string) || "")
    setEditIsPaid((area.is_paid as boolean) || false)
    setEditIsReservable((area.is_reservable as boolean) ?? true)
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
      fd.set("is_reservable", editIsReservable.toString())
      await updateCommonArea(fd)
      setOpenEdit(null)
    } catch (error) {
      console.error("[v0] Update error:", error)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground text-sm">{areas.length} áreas registradas</p>

      {isAdmin && (
        <div className="flex items-center justify-end">
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
                <MapPin className="h-5 w-5" />
                Nueva Area
              </Button>
            </DialogTrigger>
            <DialogContent
              className="border-2 max-h-[90vh] overflow-y-auto"
              style={{
                backgroundColor: dialogBgColor,
                color: dialogTextColor,
                borderColor: dialogBgColor
              }}
            >
              <DialogHeader><DialogTitle style={{ color: dialogTextColor }}>Registrar Área Común</DialogTitle></DialogHeader>
              <form
                action={async (fd) => {
                  fd.set("photo_url", photoUrl)
                  fd.set("is_paid", isPaid.toString())
                  fd.set("is_reservable", isReservable.toString())
                  await createCommonArea(fd)
                  setOpenNew(false)
                  setPhotoUrl("")
                  setIsPaid(false)
                  setIsReservable(true)
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="area_name" style={{ color: dialogTextColor }}>Nombre</Label>
                  <Input id="area_name" name="name" placeholder="Ej: Piscina, Salon multiuso..." required style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="area_desc" style={{ color: dialogTextColor }}>Descripción</Label>
                  <Textarea id="area_desc" name="description" placeholder="Descripcion del area..." style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label style={{ color: dialogTextColor }}>Foto</Label>
                  <FileUpload bucket="projects" folder="areas" onUpload={setPhotoUrl} label="Subir foto" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      id="is_paid_area" 
                      checked={isPaid} 
                      onCheckedChange={(checked) => setIsPaid(checked === true)} 
                      className="w-5 h-5 border-2" 
                    />
                    <Label htmlFor="is_paid_area" style={{ color: dialogTextColor }}>Uso pagado</Label>
                  </div>
                  <Badge className="bg-white text-slate-900 border font-semibold">
                    {isPaid ? "Pagado" : "Gratis"}
                  </Badge>
                </div>
                {isPaid && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="usage_fee" style={{ color: dialogTextColor }}>Tarifa de uso ({currencySymbol})</Label>
                    <Input id="usage_fee" name="usage_fee" type="number" step="0.01" placeholder="0.00" style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="maintenance_responsible" style={{ color: dialogTextColor }}>Responsable de mantenimiento</Label>
                  <Input id="maintenance_responsible" name="maintenance_responsible" placeholder="Persona o empresa" style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                </div>

                {/* Configuración de Reservas */}
                <div className="border-t pt-4 mt-2" style={{ borderColor: inputTextColor }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        id="is_reservable" 
                        checked={isReservable} 
                        onCheckedChange={(checked) => setIsReservable(checked === true)} 
                        className="w-5 h-5 border-2" 
                      />
                      <Label htmlFor="is_reservable" style={{ color: dialogTextColor }}>Permitir reservas</Label>
                    </div>
                    <Badge className="bg-white text-slate-900 border font-semibold">
                      {isReservable ? "Reservable" : "Sin reservas"}
                    </Badge>
                  </div>

                  {isReservable && (
                    <div className="flex flex-col gap-4 p-3 rounded-lg" style={{ backgroundColor: inputBgColor }}>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="max_hours" style={{ color: dialogTextColor, fontSize: "12px" }}>Max. horas por reserva</Label>
                          <Input id="max_hours" name="max_hours_per_reservation" type="number" min="1" max="24" defaultValue="2" style={{ borderColor: inputTextColor, backgroundColor: dialogBgColor, color: inputTextColor }} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="min_hours_modify" style={{ color: dialogTextColor, fontSize: "12px" }}>Horas límite para modificar</Label>
                          <Input id="min_hours_modify" name="min_hours_to_modify" type="number" min="1" max="48" defaultValue="12" style={{ borderColor: inputTextColor, backgroundColor: dialogBgColor, color: inputTextColor }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="reception_time" style={{ color: dialogTextColor, fontSize: "12px" }}>Tiempo recepción (min)</Label>
                          <Input id="reception_time" name="reception_time_minutes" type="number" min="0" max="120" defaultValue="30" style={{ borderColor: inputTextColor, backgroundColor: dialogBgColor, color: inputTextColor }} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="delivery_time" style={{ color: dialogTextColor, fontSize: "12px" }}>Tiempo entrega (min)</Label>
                          <Input id="delivery_time" name="delivery_time_minutes" type="number" min="0" max="120" defaultValue="30" style={{ borderColor: inputTextColor, backgroundColor: dialogBgColor, color: inputTextColor }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="opening_time" style={{ color: dialogTextColor, fontSize: "12px" }}>Hora apertura</Label>
                          <Input id="opening_time" name="opening_time" type="time" defaultValue="08:00" style={{ borderColor: inputTextColor, backgroundColor: dialogBgColor, color: inputTextColor }} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="closing_time" style={{ color: dialogTextColor, fontSize: "12px" }}>Hora cierre</Label>
                          <Input id="closing_time" name="closing_time" type="time" defaultValue="22:00" style={{ borderColor: inputTextColor, backgroundColor: dialogBgColor, color: inputTextColor }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Guardar Área</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {areas.length === 0 ? (
        <div className="rounded-lg border-2 p-12 text-center" style={{ backgroundColor: cardBgColor, color: cardTextColor, borderColor: cardTextColor }}>
          <MapPin className="h-10 w-10 mx-auto mb-2" />
          <p>No hay areas comunes registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {areas.map((area) => (
            <div key={area.id as string} className="rounded-lg border-2 p-4 hover:shadow-md transition-shadow" style={{ backgroundColor: cardBgColor, color: cardTextColor, borderColor: cardTextColor }}>
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
                    <p className="text-xs font-medium uppercase" style={{ color: cardTextColor, opacity: 0.7 }}>Área</p>
                    <h3 className="text-xl font-bold" style={{ color: cardTextColor }}>{area.name as string}</h3>
                  </div>
                  <Badge variant={area.is_paid ? "default" : "secondary"} className="text-xs bg-green-600 text-white dark:bg-green-700 dark:text-white">
                    {area.is_paid ? "Pagado" : "Gratis"}
                  </Badge>
                </div>

                {/* Descripción */}
                {area.description ?
                  <p className="text-sm" style={{ color: cardTextColor, opacity: 0.8 }}>{area.description as string}</p>
                  : null}

                {/* Información de tarifa */}
                {area.is_paid && area.usage_fee ? (
                  <div className="flex items-center gap-2" style={{ color: cardTextColor, opacity: 0.8 }}>
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Tarifa: {currencySymbol}{Number(area.usage_fee).toLocaleString()}</span>
                  </div>
                ) : null}

                {/* Responsable de mantenimiento */}
                {area.maintenance_responsible ? (
                  <div className="flex items-center gap-2" style={{ color: cardTextColor, opacity: 0.8 }}>
                    <Wrench className="h-4 w-4" />
                    <span className="text-sm">Mant.: {area.maintenance_responsible as string}</span>
                  </div>
                ) : null}

                {/* Botones de acciones */}
                {isAdmin && (
                  <div className="flex gap-2 pt-3" style={{ borderTopColor: cardTextColor, borderTop: `1px solid ${cardTextColor}`, paddingTop: "12px" }}>
                    <Dialog open={openEdit === area.id} onOpenChange={(open) => !open && setOpenEdit(null)}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="flex-1"
                          style={{ backgroundColor: cardBgColor === "#1e293b" ? "#f1f5f9" : "#1e293b", color: cardBgColor === "#1e293b" ? "#1e293b" : "#f1f5f9" }}
                          onClick={() => handleEditClick(area)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" style={{ color: cardBgColor === "#1e293b" ? "#64748b" : "#94a3b8" }} />
                          Editar
                        </Button>
                      </DialogTrigger>
                      <DialogContent
                        className="border-2 max-h-[90vh] overflow-y-auto"
                        style={{
                          backgroundColor: dialogBgColor,
                          color: dialogTextColor,
                          borderColor: dialogBgColor
                        }}
                      >
                        <DialogHeader><DialogTitle style={{ color: dialogTextColor }}>Editar Área Común</DialogTitle></DialogHeader>
                        <form
                          action={async (fd) => {
                            await handleEditSubmit(fd, area.id as string)
                          }}
                          className="flex flex-col gap-4"
                        >
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="edit_name" style={{ color: dialogTextColor }}>Nombre</Label>
                            <Input
                              id="edit_name"
                              name="name"
                              defaultValue={area.name as string}
                              required
                              style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="edit_desc" style={{ color: dialogTextColor }}>Descripción</Label>
                            <Textarea
                              id="edit_desc"
                              name="description"
                              defaultValue={(area.description as string) || ""}
                              style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label style={{ color: dialogTextColor }}>Foto</Label>
                            <FileUpload
                              bucket="projects"
                              folder="areas"
                              onUpload={setEditPhotoUrl}
                              label="Cambiar foto"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                id="edit_is_paid"
                                checked={editIsPaid}
                                onCheckedChange={(checked) => {
                                  if (typeof checked === 'boolean') {
                                    setEditIsPaid(checked)
                                  }
                                }}
                                className="w-5 h-5 border-2"
                              />
                              <Label htmlFor="edit_is_paid" style={{ color: dialogTextColor }}>Uso pagado</Label>
                            </div>
                            <Badge className="bg-white text-slate-900 border font-semibold">
                              {editIsPaid ? "Pagado" : "Gratis"}
                            </Badge>
                          </div>
                          {editIsPaid && (
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="edit_usage_fee" style={{ color: dialogTextColor }}>Tarifa de uso ({currencySymbol})</Label>
                              <Input
                                id="edit_usage_fee"
                                name="usage_fee"
                                type="number"
                                step="0.01"
                                defaultValue={(area.usage_fee as number) || 0}
                                style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
                              />
                            </div>
                          )}
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="edit_maintenance" style={{ color: dialogTextColor }}>Responsable de mantenimiento</Label>
                            <Input
                              id="edit_maintenance"
                              name="maintenance_responsible"
                              defaultValue={(area.maintenance_responsible as string) || ""}
                              style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }}
                            />
                          </div>

                          {/* Configuración de Reservas - Editar */}
                          <div className="border-t pt-4 mt-2" style={{ borderColor: inputTextColor }}>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <Checkbox 
                                  id="edit_is_reservable" 
                                  checked={editIsReservable} 
                                  onCheckedChange={(checked) => setEditIsReservable(checked === true)} 
                                  className="w-5 h-5 border-2" 
                                />
                                <Label htmlFor="edit_is_reservable" style={{ color: dialogTextColor }}>Permitir reservas</Label>
                              </div>
                              <Badge className="bg-white text-slate-900 border font-semibold">
                                {editIsReservable ? "Reservable" : "Sin reservas"}
                              </Badge>
                            </div>

                            {editIsReservable && (
                              <div className="flex flex-col gap-4 p-3 rounded-lg" style={{ backgroundColor: inputBgColor }}>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="flex flex-col gap-1">
                                    <Label style={{ color: dialogTextColor, fontSize: "12px" }}>Max. horas por reserva</Label>
                                    <Input name="max_hours_per_reservation" type="number" min="1" max="24" defaultValue={(area.max_hours_per_reservation as number) || 2} style={{ borderColor: inputTextColor, backgroundColor: dialogBgColor, color: inputTextColor }} />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <Label style={{ color: dialogTextColor, fontSize: "12px" }}>Horas límite para modificar</Label>
                                    <Input name="min_hours_to_modify" type="number" min="1" max="48" defaultValue={(area.min_hours_to_modify as number) || 12} style={{ borderColor: inputTextColor, backgroundColor: dialogBgColor, color: inputTextColor }} />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="flex flex-col gap-1">
                                    <Label style={{ color: dialogTextColor, fontSize: "12px" }}>Tiempo recepción (min)</Label>
                                    <Input name="reception_time_minutes" type="number" min="0" max="120" defaultValue={(area.reception_time_minutes as number) || 30} style={{ borderColor: inputTextColor, backgroundColor: dialogBgColor, color: inputTextColor }} />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <Label style={{ color: dialogTextColor, fontSize: "12px" }}>Tiempo entrega (min)</Label>
                                    <Input name="delivery_time_minutes" type="number" min="0" max="120" defaultValue={(area.delivery_time_minutes as number) || 30} style={{ borderColor: inputTextColor, backgroundColor: dialogBgColor, color: inputTextColor }} />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="flex flex-col gap-1">
                                    <Label style={{ color: dialogTextColor, fontSize: "12px" }}>Hora apertura</Label>
                                    <Input name="opening_time" type="time" defaultValue={(area.opening_time as string) || "08:00"} style={{ borderColor: inputTextColor, backgroundColor: dialogBgColor, color: inputTextColor }} />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <Label style={{ color: dialogTextColor, fontSize: "12px" }}>Hora cierre</Label>
                                    <Input name="closing_time" type="time" defaultValue={(area.closing_time as string) || "22:00"} style={{ borderColor: inputTextColor, backgroundColor: dialogBgColor, color: inputTextColor }} />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Guardar Cambios</Button>
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
                      <AlertDialogContent
                        className="border-2"
                        style={{
                          backgroundColor: dialogBgColor,
                          color: dialogTextColor,
                          borderColor: dialogBgColor
                        }}
                      >
                        <AlertDialogHeader>
                          <AlertDialogTitle style={{ color: dialogTextColor }}>Eliminar Área Común</AlertDialogTitle>
                          <AlertDialogDescription style={{ color: dialogTextColor, opacity: 0.7 }}>
                            {"¿Estás seguro de que deseas eliminar \"" + (area.name as string) + "\"? Esta acción no puede deshacerse."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex gap-3 justify-end">
                          <AlertDialogCancel style={{ color: dialogTextColor, borderColor: dialogTextColor }}>Cancelar</AlertDialogCancel>
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
