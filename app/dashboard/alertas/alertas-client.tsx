"use client"

import { useState } from "react"
import { useTheme } from "../theme-context"
import { createAlert, updateAlert, deleteAlert } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Plus, Bell, AlertTriangle, Info, AlertCircle, MoreHorizontal, Edit2, Trash2, TriangleAlert } from "lucide-react"

interface Alert {
  id: string
  title: string
  message: string
  priority: "baja" | "media" | "alta" | "urgente"
  is_active: boolean
  created_at: string
  expires_at: string | null
}

interface AlertasClientProps {
  alerts: Alert[]
  isAdmin: boolean
}

const priorityConfig = {
  baja: { label: "Baja", color: "bg-blue-100 text-blue-800", icon: Info },
  media: { label: "Media", color: "bg-yellow-100 text-yellow-800", icon: Bell },
  alta: { label: "Alta", color: "bg-orange-100 text-orange-800", icon: AlertCircle },
  urgente: { label: "Urgente", color: "bg-red-100 text-red-800", icon: AlertTriangle },
}

export function AlertasClient({ alerts, isAdmin }: AlertasClientProps) {
  const [openNew, setOpenNew] = useState(false)
  const [priority, setPriority] = useState<string>("media")
  const [editOpen, setEditOpen] = useState<string | null>(null)
  const [editPriority, setEditPriority] = useState<string>("media")
  const { dialogBgColor, dialogTextColor, inputBgColor, inputTextColor, cardBgColor, cardTextColor } = useTheme()

  const activeAlerts = alerts.filter((a) => a.is_active)
  const inactiveAlerts = alerts.filter((a) => !a.is_active)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alertas y Avisos</h1>
          <p className="text-sm text-muted-foreground">
            {activeAlerts.length} alerta{activeAlerts.length !== 1 ? "s" : ""} activa{activeAlerts.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={openNew} onOpenChange={(v) => { setOpenNew(v); if (!v) setPriority("media") }}>
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
                <TriangleAlert className="h-5 w-5" />
                Nueva Alerta
              </Button>

            </DialogTrigger>
            <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }}>
              <DialogHeader>
                <DialogTitle style={{ color: dialogTextColor }}>Crear Alerta</DialogTitle>
                <DialogDescription style={{ color: dialogTextColor }}>Publica una nueva alerta para los residentes</DialogDescription>
              </DialogHeader>
              <form
                action={async (fd) => {
                  fd.set("priority", priority)
                  await createAlert(fd)
                  setOpenNew(false)
                  setPriority("media")
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="title" style={{ color: dialogTextColor }}>Titulo</Label>
                  <Input id="title" name="title" placeholder="Ej: Corte de agua programado..." required style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="message" style={{ color: dialogTextColor }}>Mensaje</Label>
                  <Textarea id="message" name="message" placeholder="Descripcion detallada del aviso..." rows={4} required style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label style={{ color: dialogTextColor }}>Prioridad</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}><SelectValue /></SelectTrigger>
                      <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}>
                        <SelectItem value="baja">Baja</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="expires_at" style={{ color: dialogTextColor }}>Expira (opcional)</Label>
                    <Input id="expires_at" name="expires_at" type="date" style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Publicar Alerta</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Active Alerts */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Alertas Activas</h2>
        {activeAlerts.length === 0 ? (
          <Card style={{ backgroundColor: cardBgColor || undefined }}>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground" style={{ color: cardTextColor }}>
              <Bell className="h-10 w-10" />
              <p>No hay alertas activas</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {activeAlerts.map((alert) => {
              const config = priorityConfig[alert.priority] || priorityConfig.media
              const Icon = config.icon

              return (
                <Card key={alert.id} className="overflow-hidden" style={{ backgroundColor: cardBgColor || undefined }}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <CardTitle style={{ color: cardTextColor }} className="text-base">{alert.title}</CardTitle>
                        <Badge className={config.color}>{config.label}</Badge>
                      </div>
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" style={{ backgroundColor: cardBgColor, color: cardTextColor, borderColor: cardTextColor }}>
                            <DropdownMenuItem onClick={() => { setEditPriority(alert.priority); setEditOpen(alert.id) }}>
                              <Edit2 className="h-4 w-4 mr-2" />Editar
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />Eliminar
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }}>
                                <AlertDialogHeader>
                                  <AlertDialogTitle style={{ color: dialogTextColor }}>Eliminar Alerta</AlertDialogTitle>
                                  <AlertDialogDescription style={{ color: dialogTextColor }}>
                                    Esta accion no se puede deshacer. Se eliminara permanentemente esta alerta.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="flex gap-3 justify-end">
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteAlert(alert.id)}
                                    className="bg-destructive text-white hover:bg-destructive/90"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </div>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <CardDescription style={{ color: cardTextColor }} className="text-xs">
                      Publicada: {new Date(alert.created_at).toLocaleDateString("es-CL")}
                      {alert.expires_at && ` | Expira: ${new Date(alert.expires_at).toLocaleDateString("es-CL")}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent style={{ color: cardTextColor }}>
                    <p className="text-sm whitespace-pre-wrap">{alert.message}</p>
                  </CardContent>

                  {/* Edit Dialog */}
                  <Dialog open={editOpen === alert.id} onOpenChange={(v) => !v && setEditOpen(null)}>
                    <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }}>
                      <DialogHeader>
                        <DialogTitle style={{ color: dialogTextColor }}>Editar Alerta</DialogTitle>
                        <DialogDescription style={{ color: dialogTextColor }}>Modifica los detalles de la alerta</DialogDescription>
                      </DialogHeader>
                      <form
                        action={async (fd) => {
                          fd.set("id", alert.id)
                          fd.set("priority", editPriority)
                          await updateAlert(fd)
                          setEditOpen(null)
                        }}
                        className="flex flex-col gap-4"
                      >
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="edit_title" style={{ color: dialogTextColor }}>Titulo</Label>
                          <Input id="edit_title" name="title" defaultValue={alert.title} required style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="edit_message" style={{ color: dialogTextColor }}>Mensaje</Label>
                          <Textarea id="edit_message" name="message" defaultValue={alert.message} rows={4} required style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <Label style={{ color: dialogTextColor }}>Prioridad</Label>
<Select value={editPriority} onValueChange={setEditPriority}>
                      <SelectTrigger style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}><SelectValue /></SelectTrigger>
                      <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}>
                        <SelectItem value="baja">Baja</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="edit_expires" style={{ color: dialogTextColor }}>Expira (opcional)</Label>
                            <Input id="edit_expires" name="expires_at" type="date" defaultValue={alert.expires_at?.split("T")[0] || ""} style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                          </div>
                        </div>
                        <Button type="submit" className="w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Guardar Cambios</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Inactive/Past Alerts */}
      {inactiveAlerts.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Alertas Anteriores</h2>
          <div className="flex flex-col gap-2">
            {inactiveAlerts.map((alert) => (
              <Card key={alert.id} className="opacity-60">
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">{alert.title}</CardTitle>
                      <Badge variant="secondary" className="text-xs">Inactiva</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.created_at).toLocaleDateString("es-CL")}
                    </span>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
