"use client"

import { useState } from "react"
import { useTheme } from "../theme-context"
import { createProject, updateProjectStatus, addProjectQuote, updateProject, deleteProject, updateProjectQuote, deleteProjectQuote } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FileUpload } from "@/components/file-upload"
import { Plus, Hammer, ChevronDown, ChevronUp, FileText, ExternalLink, MoreHorizontal, Edit2, Trash2, Wrench } from "lucide-react"

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  propuesto: { label: "Propuesto", color: "bg-blue-500/10 text-blue-700" },
  aprobado: { label: "Aprobado", color: "bg-emerald-500/10 text-emerald-700" },
  en_progreso: { label: "En Progreso", color: "bg-amber-500/10 text-amber-700" },
  completado: { label: "Completado", color: "bg-green-500/10 text-green-700" },
  cancelado: { label: "Cancelado", color: "bg-red-500/10 text-red-700" },
}

interface ProyectosClientProps {
  projects: Record<string, unknown>[]
  commonAreas: Array<{ id: string; name: string }>
  currencySymbol: string
  isAdmin: boolean
  canView: boolean
}

export function ProyectosClient({ projects, commonAreas, currencySymbol, isAdmin, canView }: ProyectosClientProps) {
  const [openNew, setOpenNew] = useState(false)
  const [openQuote, setOpenQuote] = useState<string | null>(null)
  const [locationUrl, setLocationUrl] = useState("")
  const [docUrl, setDocUrl] = useState("")
  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [statusUpdate, setStatusUpdate] = useState("")
  const [editProject, setEditProject] = useState<string | null>(null)
  const [editQuote, setEditQuote] = useState<string | null>(null)
  const { dialogBgColor, dialogTextColor, inputBgColor, inputTextColor, cardBgColor, cardTextColor } = useTheme()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold text-black mb-4">{projects.length} proyectos registrados</p>
        {isAdmin && (
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
                <Wrench className="h-5 w-5" />
                Agregar Proyecto
              </Button>
            </DialogTrigger>
            <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }} className="max-w-lg">
              <DialogHeader>
                <DialogTitle style={{ color: dialogTextColor }}>Crear Proyecto de Mejora</DialogTitle>
                <DialogDescription style={{ color: dialogTextColor }}>Ingresa los detalles del nuevo proyecto</DialogDescription>
              </DialogHeader>
              <form
                action={async (fd) => {
                  fd.set("location_photo_url", locationUrl)
                  await createProject(fd)
                  setOpenNew(false)
                  setLocationUrl("")
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name" style={{ color: dialogTextColor }}>Nombre del Proyecto</Label>
                  <Input id="name" name="name" placeholder="Ej: Remodelacion piscina" required style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="improvement_type" style={{ color: dialogTextColor }}>Tipo de Mejora</Label>
                  <Input id="improvement_type" name="improvement_type" placeholder="Ej: Infraestructura, Jardineria..." style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description" style={{ color: dialogTextColor }}>Descripcion</Label>
                  <Textarea id="description" name="description" placeholder="Detalle del proyecto..." style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="location_description" style={{ color: dialogTextColor }}>Ubicacion / Area</Label>
                  <Select name="location_description" required>
                    <SelectTrigger style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}>
                      <SelectValue placeholder="Seleccionar área común" />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}>
                      {commonAreas.map((area) => (
                        <SelectItem key={area.id} value={area.name}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label style={{ color: dialogTextColor }}>Foto del area</Label>
                  <FileUpload bucket="projects" onUpload={setLocationUrl} label="Subir foto del area" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="estimated_cost" style={{ color: dialogTextColor }}>Costo Estimado</Label>
                    <Input id="estimated_cost" name="estimated_cost" type="number" step="0.01" placeholder="0.00" style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="start_date" style={{ color: dialogTextColor }}>Fecha Inicio</Label>
                    <Input id="start_date" name="start_date" type="date" style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                  </div>
                </div>
                <Button type="submit" className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Crear Proyecto</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {openQuote && (
        <Dialog open={!!openQuote} onOpenChange={() => { setOpenQuote(null); setDocUrl("") }}>
          <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }}>
            <DialogHeader>
              <DialogTitle style={{ color: dialogTextColor }}>Agregar Cotizacion</DialogTitle>
              <DialogDescription style={{ color: dialogTextColor }}>Ingresa los detalles de la cotización</DialogDescription>
            </DialogHeader>
            <form
              action={async (fd) => {
                fd.set("project_id", openQuote)
                fd.set("document_url", docUrl)
                await addProjectQuote(fd)
                setOpenQuote(null)
                setDocUrl("")
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="vendor_name" style={{ color: dialogTextColor }}>Proveedor</Label>
                <Input id="vendor_name" name="vendor_name" placeholder="Nombre del proveedor" required style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="quote_amount" style={{ color: dialogTextColor }}>Monto</Label>
                <Input id="quote_amount" name="amount" type="number" step="0.01" required style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="quote_desc" style={{ color: dialogTextColor }}>Descripcion</Label>
                <Textarea id="quote_desc" name="description" placeholder="Detalle de la cotizacion..." style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
              </div>
              <div className="flex flex-col gap-2">
                <Label style={{ color: dialogTextColor }}>Documento de cotizacion</Label>
                <FileUpload bucket="projects" folder="quotes" onUpload={setDocUrl} accept="image/*,application/pdf" label="Subir cotizacion" />
              </div>
              <Button type="submit" className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Guardar Cotizacion</Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {projects.length === 0 ? (
        <Card style={{ backgroundColor: cardBgColor || undefined }}>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <Hammer className="h-10 w-10" />
            <p style={{ color: cardTextColor }}>No hay proyectos registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {projects.map((project) => {
            const quotes = (project.project_quotes as Record<string, unknown>[]) || []
            const status = STATUS_MAP[(project.status as string) || "propuesto"] || STATUS_MAP.propuesto
            const isExpanded = expandedProject === (project.id as string)

            return (
              <Card key={project.id as string} style={{ backgroundColor: cardBgColor || undefined }}>
                <CardHeader className="cursor-pointer" onClick={() => setExpandedProject(isExpanded ? null : (project.id as string))}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                        {status.label}
                      </div>
                      <CardTitle style={{ color: cardTextColor }} className="text-base">{project.name as string}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button 
                              size="sm" 
                              className="h-9 px-3 bg-white hover:bg-gray-100 text-slate-900 rounded-lg transition-colors shadow-md"
                              title="Acciones del proyecto"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" style={{ backgroundColor: cardBgColor, color: cardTextColor, borderColor: cardTextColor }}>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditProject(project.id as string) }}>
                              <Edit2 className="h-4 w-4 mr-2" />Editar
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />Eliminar
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }} onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                  <AlertDialogTitle style={{ color: dialogTextColor }}>Eliminar Proyecto: {project.name as string}</AlertDialogTitle>
                                  <AlertDialogDescription style={{ color: dialogTextColor }}>
                                    Esta accion eliminara el proyecto y todas sus cotizaciones. No se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="flex gap-3 justify-end">
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction asChild>
                                    <Button variant="destructive" onClick={() => deleteProject(project.id as string)}>
                                      Eliminar
                                    </Button>
                                  </AlertDialogAction>
                                </div>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      {isExpanded ? <ChevronUp className="h-5 w-5" style={{ color: cardTextColor }} /> : <ChevronDown className="h-5 w-5" style={{ color: cardTextColor }} />}
                    </div>
                  </div>
                  {project.improvement_type ? (
                    <CardDescription style={{ color: cardTextColor }}>{project.improvement_type as string}</CardDescription>
                  ) : null}
                </CardHeader>

                {/* Edit Project Dialog */}
                {isAdmin && (
                  <Dialog open={editProject === project.id} onOpenChange={(v) => !v && setEditProject(null)}>
                    <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }} onClick={(e) => e.stopPropagation()}>
                      <DialogHeader>
                        <DialogTitle style={{ color: dialogTextColor }}>Editar Proyecto</DialogTitle>
                        <DialogDescription style={{ color: dialogTextColor }}>Modifica los detalles del proyecto</DialogDescription>
                      </DialogHeader>
                      <form
                        action={async (fd) => {
                          fd.set("id", project.id as string)
                          await updateProject(fd)
                          setEditProject(null)
                        }}
                        className="flex flex-col gap-4"
                      >
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="edit_name" style={{ color: dialogTextColor }}>Nombre</Label>
                          <Input id="edit_name" name="name" defaultValue={project.name as string} required style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="edit_type" style={{ color: dialogTextColor }}>Tipo de Mejora</Label>
                          <Input id="edit_type" name="improvement_type" defaultValue={(project.improvement_type as string) || ""} style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="edit_desc" style={{ color: dialogTextColor }}>Descripcion</Label>
                          <Textarea id="edit_desc" name="description" defaultValue={(project.description as string) || ""} style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="edit_location" style={{ color: dialogTextColor }}>Ubicacion / Area</Label>
                          <Select name="location_description" defaultValue={(project.location_description as string) || ""}>
                            <SelectTrigger style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}>
                              {commonAreas.map((area) => (
                                <SelectItem key={area.id} value={area.name}>
                                  {area.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="edit_cost" style={{ color: dialogTextColor }}>Costo Estimado</Label>
                          <Input id="edit_cost" name="estimated_cost" type="number" defaultValue={(project.estimated_cost as number) || ""} style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                        </div>
                        <Button type="submit" className="w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Guardar Cambios</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
                {isExpanded && (
                  <CardContent className="flex flex-col gap-4" style={{ color: cardTextColor }}>
                    {project.description ? <p className="text-sm">{project.description as string}</p> : null}

                    <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                      {project.location_description ? (
                        <div>
                          <p style={{ color: cardTextColor, opacity: 0.7 }}>Ubicacion</p>
                          <p className="font-medium">{project.location_description as string}</p>
                        </div>
                      ) : null}
                      {project.estimated_cost ? (
                        <div>
                          <p style={{ color: cardTextColor, opacity: 0.7 }}>Costo Estimado</p>
                          <p className="font-medium">{currencySymbol}{Number(project.estimated_cost).toLocaleString()}</p>
                        </div>
                      ) : null}
                      {project.actual_cost ? (
                        <div>
                          <p style={{ color: cardTextColor, opacity: 0.7 }}>Costo Real</p>
                          <p className="font-medium">{currencySymbol}{Number(project.actual_cost).toLocaleString()}</p>
                        </div>
                      ) : null}
                      {project.start_date ? (
                        <div>
                          <p style={{ color: cardTextColor, opacity: 0.7 }}>Inicio</p>
                          <p className="font-medium">{project.start_date as string}</p>
                        </div>
                      ) : null}
                    </div>

                    {project.location_photo_url ? (
                      <img
                        src={project.location_photo_url as string}
                        alt="Ubicacion del proyecto"
                        className="h-48 w-full rounded-lg object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : null}

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold" style={{ color: cardTextColor }}>Cotizaciones ({quotes.length})</h4>
                        {isAdmin && (
                          <Button size="sm" variant="outline" onClick={() => setOpenQuote(project.id as string)}>
                            <Plus className="mr-1 h-3 w-3" />Cotizacion
                          </Button>
                        )}
                      </div>
                      {quotes.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {quotes.map((q) => (
                            <div key={q.id as string} className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: cardTextColor, backgroundColor: `${cardBgColor}80` }}>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" style={{ color: cardTextColor, opacity: 0.7 }} />
                                <div>
                                  <p className="text-sm font-medium" style={{ color: cardTextColor }}>{q.vendor_name as string}</p>
                                  {q.description ? <p className="text-xs" style={{ color: cardTextColor, opacity: 0.7 }}>{q.description as string}</p> : null}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold" style={{ color: cardTextColor }}>{currencySymbol}{Number(q.amount).toLocaleString()}</span>
                                {q.is_selected ? <Badge>Seleccionada</Badge> : null}
                                {q.document_url ? (
                                  <Button asChild variant="outline" size="sm">
                                    <a
                                      href={q.document_url as string}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <ExternalLink className="h-3 w-3 mr-1" />Ver
                                    </a>
                                  </Button>
                                ) : (
                                  <span className="text-xs" style={{ color: cardTextColor, opacity: 0.7 }}>Sin doc</span>
                                )}
                                {isAdmin && (
                                  <>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" style={{ backgroundColor: cardBgColor, color: cardTextColor, borderColor: cardTextColor }}>
                                        <DropdownMenuItem onClick={() => setEditQuote(q.id as string)}>
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
                                              <AlertDialogTitle style={{ color: dialogTextColor }}>Eliminar Cotizacion: {q.vendor_name as string}</AlertDialogTitle>
                                              <AlertDialogDescription style={{ color: dialogTextColor }}>
                                                Esta accion eliminara la cotizacion. No se puede deshacer.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <div className="flex gap-3 justify-end">
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction asChild>
                                                <Button variant="destructive" onClick={() => deleteProjectQuote(q.id as string)}>
                                                  Eliminar
                                                </Button>
                                              </AlertDialogAction>
                                            </div>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </DropdownMenuContent>
                                    </DropdownMenu>

                                    {/* Edit Quote Dialog */}
                                    <Dialog open={editQuote === q.id} onOpenChange={(v) => !v && setEditQuote(null)}>
                                      <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }}>
                                        <DialogHeader>
                                          <DialogTitle style={{ color: dialogTextColor }}>Editar Cotizacion</DialogTitle>
                                          <DialogDescription style={{ color: dialogTextColor }}>Modifica los detalles de la cotización</DialogDescription>
                                        </DialogHeader>
                                        <form
                                          action={async (fd) => {
                                            fd.set("id", q.id as string)
                                            await updateProjectQuote(fd)
                                            setEditQuote(null)
                                          }}
                                          className="flex flex-col gap-4"
                                        >
                                          <div className="flex flex-col gap-2">
                                            <Label htmlFor="edit_vendor" style={{ color: dialogTextColor }}>Proveedor</Label>
                                            <Input id="edit_vendor" name="vendor_name" defaultValue={q.vendor_name as string} required style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                                          </div>
                                          <div className="flex flex-col gap-2">
                                            <Label htmlFor="edit_amount" style={{ color: dialogTextColor }}>Monto</Label>
                                            <Input id="edit_amount" name="amount" type="number" defaultValue={q.amount as number} required style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                                          </div>
                                          <div className="flex flex-col gap-2">
                                            <Label htmlFor="edit_quote_desc" style={{ color: dialogTextColor }}>Descripcion</Label>
                                            <Textarea id="edit_quote_desc" name="description" defaultValue={(q.description as string) || ""} style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                                          </div>
                                          <Button type="submit" className="w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Guardar Cambios</Button>
                                        </form>
                                      </DialogContent>
                                    </Dialog>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Sin cotizaciones</p>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-2 border-t pt-4">
                        <Label className="text-sm">Cambiar estado:</Label>
                        <Select
                          value={statusUpdate || (project.status as string)}
                          onValueChange={async (val) => {
                            setStatusUpdate(val)
                            await updateProjectStatus(project.id as string, val)
                            setStatusUpdate("")
                          }}
                        >
                          <SelectTrigger className="w-40" style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}><SelectValue /></SelectTrigger>
                          <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}>
                            {Object.entries(STATUS_MAP).map(([key, v]) => (
                              <SelectItem key={key} value={key}>{v.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
