"use client"

import { useState } from "react"
import { createProject, updateProjectStatus, addProjectQuote, updateProject, deleteProject, updateProjectQuote, deleteProjectQuote } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FileUpload } from "@/components/file-upload"
import { Plus, Hammer, ChevronDown, ChevronUp, FileText, ExternalLink, MoreHorizontal, Edit2, Trash2 } from "lucide-react"

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  propuesto: { label: "Propuesto", color: "bg-blue-500/10 text-blue-700" },
  aprobado: { label: "Aprobado", color: "bg-emerald-500/10 text-emerald-700" },
  en_progreso: { label: "En Progreso", color: "bg-amber-500/10 text-amber-700" },
  completado: { label: "Completado", color: "bg-green-500/10 text-green-700" },
  cancelado: { label: "Cancelado", color: "bg-red-500/10 text-red-700" },
}

interface ProyectosClientProps {
  projects: Record<string, unknown>[]
  currencySymbol: string
  isAdmin: boolean
}

export function ProyectosClient({ projects, currencySymbol, isAdmin }: ProyectosClientProps) {
  const [openNew, setOpenNew] = useState(false)
  const [openQuote, setOpenQuote] = useState<string | null>(null)
  const [locationUrl, setLocationUrl] = useState("")
  const [docUrl, setDocUrl] = useState("")
  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [statusUpdate, setStatusUpdate] = useState("")
  const [editProject, setEditProject] = useState<string | null>(null)
  const [editQuote, setEditQuote] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proyectos de Mejora</h1>
          <p className="text-sm text-muted-foreground">{projects.length} proyectos registrados</p>
        </div>
        {isAdmin && (
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Nuevo Proyecto</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Crear Proyecto de Mejora</DialogTitle></DialogHeader>
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
                  <Label htmlFor="name">Nombre del Proyecto</Label>
                  <Input id="name" name="name" placeholder="Ej: Remodelacion piscina" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="improvement_type">Tipo de Mejora</Label>
                  <Input id="improvement_type" name="improvement_type" placeholder="Ej: Infraestructura, Jardineria..." />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Descripcion</Label>
                  <Textarea id="description" name="description" placeholder="Detalle del proyecto..." />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="location_description">Ubicacion / Area</Label>
                  <Input id="location_description" name="location_description" placeholder="Donde se realizara" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Foto del area</Label>
                  <FileUpload bucket="projects" onUpload={setLocationUrl} label="Subir foto del area" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="estimated_cost">Costo Estimado</Label>
                    <Input id="estimated_cost" name="estimated_cost" type="number" step="0.01" placeholder="0.00" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="start_date">Fecha Inicio</Label>
                    <Input id="start_date" name="start_date" type="date" />
                  </div>
                </div>
                <Button type="submit">Crear Proyecto</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {openQuote && (
        <Dialog open={!!openQuote} onOpenChange={() => { setOpenQuote(null); setDocUrl("") }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Agregar Cotizacion</DialogTitle></DialogHeader>
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
                <Label htmlFor="vendor_name">Proveedor</Label>
                <Input id="vendor_name" name="vendor_name" placeholder="Nombre del proveedor" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="quote_amount">Monto</Label>
                <Input id="quote_amount" name="amount" type="number" step="0.01" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="quote_desc">Descripcion</Label>
                <Textarea id="quote_desc" name="description" placeholder="Detalle de la cotizacion..." />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Documento de cotizacion</Label>
                <FileUpload bucket="projects" folder="quotes" onUpload={setDocUrl} accept="image/*,application/pdf" label="Subir cotizacion" />
              </div>
              <Button type="submit">Guardar Cotizacion</Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <Hammer className="h-10 w-10" />
            <p>No hay proyectos registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {projects.map((project) => {
            const quotes = (project.project_quotes as Record<string, unknown>[]) || []
            const status = STATUS_MAP[(project.status as string) || "propuesto"] || STATUS_MAP.propuesto
            const isExpanded = expandedProject === (project.id as string)

            return (
              <Card key={project.id as string}>
                <CardHeader className="cursor-pointer" onClick={() => setExpandedProject(isExpanded ? null : (project.id as string))}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                        {status.label}
                      </div>
                      <CardTitle className="text-base">{project.name as string}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditProject(project.id as string) }}>
                              <Edit2 className="h-4 w-4 mr-2" />Editar
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />Eliminar
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Eliminar Proyecto: {project.name as string}</AlertDialogTitle>
                                  <AlertDialogDescription>
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
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                  {project.improvement_type ? (
                    <CardDescription>{project.improvement_type as string}</CardDescription>
                  ) : null}
                </CardHeader>
                
                {/* Edit Project Dialog */}
                {isAdmin && (
                  <Dialog open={editProject === project.id} onOpenChange={(v) => !v && setEditProject(null)}>
                    <DialogContent onClick={(e) => e.stopPropagation()}>
                      <DialogHeader><DialogTitle>Editar Proyecto</DialogTitle></DialogHeader>
                      <form
                        action={async (fd) => {
                          fd.set("id", project.id as string)
                          await updateProject(fd)
                          setEditProject(null)
                        }}
                        className="flex flex-col gap-4"
                      >
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="edit_name">Nombre</Label>
                          <Input id="edit_name" name="name" defaultValue={project.name as string} required />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="edit_type">Tipo de Mejora</Label>
                          <Input id="edit_type" name="improvement_type" defaultValue={(project.improvement_type as string) || ""} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="edit_desc">Descripcion</Label>
                          <Textarea id="edit_desc" name="description" defaultValue={(project.description as string) || ""} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="edit_location">Ubicacion</Label>
                          <Input id="edit_location" name="location_description" defaultValue={(project.location_description as string) || ""} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="edit_cost">Costo Estimado</Label>
                          <Input id="edit_cost" name="estimated_cost" type="number" defaultValue={(project.estimated_cost as number) || ""} />
                        </div>
                        <Button type="submit">Guardar Cambios</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
                {isExpanded && (
                  <CardContent className="flex flex-col gap-4">
                    {project.description ? <p className="text-sm">{project.description as string}</p> : null}

                    <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                      {project.location_description ? (
                        <div>
                          <p className="text-muted-foreground">Ubicacion</p>
                          <p className="font-medium">{project.location_description as string}</p>
                        </div>
                      ) : null}
                      {project.estimated_cost ? (
                        <div>
                          <p className="text-muted-foreground">Costo Estimado</p>
                          <p className="font-medium">{currencySymbol}{Number(project.estimated_cost).toLocaleString()}</p>
                        </div>
                      ) : null}
                      {project.actual_cost ? (
                        <div>
                          <p className="text-muted-foreground">Costo Real</p>
                          <p className="font-medium">{currencySymbol}{Number(project.actual_cost).toLocaleString()}</p>
                        </div>
                      ) : null}
                      {project.start_date ? (
                        <div>
                          <p className="text-muted-foreground">Inicio</p>
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
                        <h4 className="text-sm font-semibold">Cotizaciones ({quotes.length})</h4>
                        {isAdmin && (
                          <Button size="sm" variant="outline" onClick={() => setOpenQuote(project.id as string)}>
                            <Plus className="mr-1 h-3 w-3" />Cotizacion
                          </Button>
                        )}
                      </div>
                      {quotes.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {quotes.map((q) => (
                            <div key={q.id as string} className="flex items-center justify-between rounded-lg border p-3">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">{q.vendor_name as string}</p>
                                  {q.description ? <p className="text-xs text-muted-foreground">{q.description as string}</p> : null}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold">{currencySymbol}{Number(q.amount).toLocaleString()}</span>
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
                                  <span className="text-xs text-muted-foreground">Sin doc</span>
                                )}
                                {isAdmin && (
                                  <>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setEditQuote(q.id as string)}>
                                          <Edit2 className="h-4 w-4 mr-2" />Editar
                                        </DropdownMenuItem>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                              <Trash2 className="h-4 w-4 mr-2" />Eliminar
                                            </DropdownMenuItem>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Eliminar Cotizacion: {q.vendor_name as string}</AlertDialogTitle>
                                              <AlertDialogDescription>
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
                                      <DialogContent>
                                        <DialogHeader><DialogTitle>Editar Cotizacion</DialogTitle></DialogHeader>
                                        <form
                                          action={async (fd) => {
                                            fd.set("id", q.id as string)
                                            await updateProjectQuote(fd)
                                            setEditQuote(null)
                                          }}
                                          className="flex flex-col gap-4"
                                        >
                                          <div className="flex flex-col gap-2">
                                            <Label htmlFor="edit_vendor">Proveedor</Label>
                                            <Input id="edit_vendor" name="vendor_name" defaultValue={q.vendor_name as string} required />
                                          </div>
                                          <div className="flex flex-col gap-2">
                                            <Label htmlFor="edit_amount">Monto</Label>
                                            <Input id="edit_amount" name="amount" type="number" defaultValue={q.amount as number} required />
                                          </div>
                                          <div className="flex flex-col gap-2">
                                            <Label htmlFor="edit_quote_desc">Descripcion</Label>
                                            <Textarea id="edit_quote_desc" name="description" defaultValue={(q.description as string) || ""} />
                                          </div>
                                          <Button type="submit">Guardar Cambios</Button>
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
                          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                          <SelectContent>
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
