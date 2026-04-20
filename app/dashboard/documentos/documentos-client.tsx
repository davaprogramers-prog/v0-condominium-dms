"use client"

import { useState, useTransition } from "react"
import { useTheme } from "../theme-context"
import { uploadDocument, updateDocument, deleteDocument } from "@/app/dashboard/actions"
import { createDocumentType, updateDocumentType, deleteDocumentType } from "./actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/file-upload"
import { Plus, FileText, ExternalLink, MoreHorizontal, Edit2, Trash2 } from "lucide-react"

interface DocumentosClientProps {
  condoId: string
  documents: Record<string, unknown>[]
  documentTypes: Record<string, unknown>[]
  isAdmin: boolean
}

export function DocumentosClient({ condoId, documents, documentTypes, isAdmin }: DocumentosClientProps) {
  const [openDoc, setOpenDoc] = useState(false)
  const [openType, setOpenType] = useState(false)
  const [selectedType, setSelectedType] = useState("")
  const [fileUrl, setFileUrl] = useState("")
  const [editOpen, setEditOpen] = useState<string | null>(null)
  const [editFileUrl, setEditFileUrl] = useState("")
  const [editTypeOpen, setEditTypeOpen] = useState<string | null>(null)
  const [isCreatingType, setIsCreatingType] = useState(false)
  const [typeName, setTypeName] = useState("")
  const [typeDescription, setTypeDescription] = useState("")
  const { dialogBgColor, dialogTextColor, inputBgColor, inputTextColor, cardBgColor, cardTextColor } = useTheme()
  const [isPending, startTransition] = useTransition()

  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingType(true)
    try {
      await createDocumentType(condoId, typeName, typeDescription)
      setTypeName("")
      setTypeDescription("")
      setOpenType(false)
    } catch (error) {
      console.error("[v0] Error creating document type:", error)
    } finally {
      setIsCreatingType(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold text-black mb-4">{documents.length} documentos almacenados</p>
        {isAdmin && (
          <div className="flex items-center gap-3 flex-wrap">
            <Dialog open={openType} onOpenChange={setOpenType}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" />Tipo</Button>
              </DialogTrigger>
              <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }}>
                <DialogHeader>
                  <DialogTitle style={{ color: dialogTextColor }}>Nuevo Tipo de Documento</DialogTitle>
                  <DialogDescription style={{ color: dialogTextColor }}>Crea un nuevo tipo para clasificar documentos</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateType} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="doc_type_name" style={{ color: dialogTextColor }}>Nombre</Label>
                    <Input
                      id="doc_type_name"
                      value={typeName}
                      onChange={(e) => setTypeName(e.target.value)}
                      placeholder="Ej: Reglamento, Sancion, Parte..."
                      required
                      style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="doc_type_desc" style={{ color: dialogTextColor }}>Descripcion</Label>
                    <Textarea
                      id="doc_type_desc"
                      value={typeDescription}
                      onChange={(e) => setTypeDescription(e.target.value)}
                      placeholder="Descripcion del tipo..."
                      style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
                    />
                  </div>
                  <Button type="submit" disabled={isCreatingType} className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">{isCreatingType ? "Guardando..." : "Guardar Tipo"}</Button>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={openDoc} onOpenChange={setOpenDoc}>
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
                  <FileText className="h-5 w-5" />
                  Subir Documento
                </Button>

              </DialogTrigger>
              <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }} className="max-w-lg">
                <DialogHeader>
                  <DialogTitle style={{ color: dialogTextColor }}>Subir Documento</DialogTitle>
                  <DialogDescription style={{ color: dialogTextColor }}>Carga un nuevo documento para los residentes</DialogDescription>
                </DialogHeader>
                <form
                  action={async (fd) => {
                    fd.set("document_type_id", selectedType)
                    fd.set("file_url", fileUrl)
                    await uploadDocument(fd)
                    setOpenDoc(false)
                    setSelectedType("")
                    setFileUrl("")
                  }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <Label style={{ color: dialogTextColor }}>Tipo de Documento</Label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                      <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                        {documentTypes.map((t) => (
                          <SelectItem key={t.id as string} value={t.id as string} style={{ color: inputTextColor }}>
                            {t.name as string}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="doc_title" style={{ color: dialogTextColor }}>Titulo</Label>
                    <Input id="doc_title" name="title" placeholder="Titulo del documento" required style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="doc_desc" style={{ color: dialogTextColor }}>Descripcion</Label>
                    <Textarea id="doc_desc" name="description" placeholder="Descripcion opcional..." style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label style={{ color: dialogTextColor }}>Archivo</Label>
                    <FileUpload bucket="documents" onUpload={setFileUrl} accept="image/*,application/pdf" label="Subir archivo (PDF o imagen)" />
                  </div>
                  <Button type="submit" disabled={!fileUrl} className="w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Guardar Documento</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documentos ({documents.length})</TabsTrigger>
          <TabsTrigger value="types">Tipos ({documentTypes.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="documents">
          <Card style={{ backgroundColor: cardBgColor || undefined }}>
            <CardHeader>
              <CardTitle style={{ color: cardTextColor }} className="text-base">Documentos del Condominio</CardTitle>
              <CardDescription style={{ color: cardTextColor }}>Reglamentos, partes, sanciones y otros documentos</CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground" style={{ color: cardTextColor }}>
                  <FileText className="h-10 w-10" />
                  <p>No hay documentos subidos</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titulo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descripcion</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Archivo</TableHead>
                        {isAdmin && <TableHead>Acciones</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.id as string}>
                          <TableCell className="font-medium">{doc.title as string}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {(doc.document_types as Record<string, unknown>)?.name as string || "Sin tipo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                            {(doc.description as string) || "-"}
                          </TableCell>
                          <TableCell className="text-sm">{new Date(doc.created_at as string).toLocaleDateString("es-CL")}</TableCell>
                          <TableCell>
                            <a
                              href={doc.file_url as string}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />Ver
                            </a>
                          </TableCell>
                          {isAdmin && (
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" style={{ backgroundColor: cardBgColor, color: cardTextColor, borderColor: cardTextColor }}>
                                  <DropdownMenuItem onClick={() => { setEditFileUrl(doc.file_url as string); setEditOpen(doc.id as string) }}>
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
                                        <AlertDialogTitle style={{ color: dialogTextColor }}>Eliminar Documento</AlertDialogTitle>
                                        <AlertDialogDescription style={{ color: dialogTextColor }}>
                                          Esta accion no se puede deshacer. Se eliminara permanentemente este documento.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <div className="flex gap-3 justify-end">
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteDocument(doc.id as string)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                          Eliminar
                                        </AlertDialogAction>
                                      </div>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>

                              {/* Edit Dialog */}
                              <Dialog open={editOpen === doc.id} onOpenChange={(v) => !v && setEditOpen(null)}>
                                <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }}>
                                  <DialogHeader>
                                    <DialogTitle style={{ color: dialogTextColor }}>Editar Documento</DialogTitle>
                                    <DialogDescription style={{ color: dialogTextColor }}>Modifica los detalles del documento</DialogDescription>
                                  </DialogHeader>
                                  <form
                                    action={async (fd) => {
                                      fd.set("id", doc.id as string)
                                      fd.set("file_url", editFileUrl || doc.file_url as string)
                                      await updateDocument(fd)
                                      setEditOpen(null)
                                    }}
                                    className="flex flex-col gap-4"
                                  >
                                    <div className="flex flex-col gap-2">
                                      <Label htmlFor="edit_title" style={{ color: dialogTextColor }}>Titulo</Label>
                                      <Input id="edit_title" name="title" defaultValue={doc.title as string} required style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <Label htmlFor="edit_desc" style={{ color: dialogTextColor }}>Descripcion (max 500 caracteres)</Label>
                                      <Textarea id="edit_desc" name="description" defaultValue={(doc.description as string) || ""} maxLength={500} rows={3} style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <Label style={{ color: dialogTextColor }}>Cambiar archivo (opcional)</Label>
                                      <FileUpload bucket="documents" onUpload={setEditFileUrl} accept="application/pdf" label="Subir nuevo PDF" />
                                    </div>
                                    <Button type="submit" className="w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Guardar Cambios</Button>
                                  </form>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="types">
          <Card>
            <CardHeader><CardTitle className="text-base">Tipos de Documento</CardTitle></CardHeader>
            <CardContent>
              {documentTypes.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No hay tipos definidos</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {documentTypes.map((t) => (
                    <div key={t.id as string} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{t.name as string}</p>
                        {t.description ? <p className="text-xs text-muted-foreground">{t.description as string}</p> : null}
                      </div>
                      {isAdmin ? (
                        <div className="flex items-center gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                size="sm" 
                                className="h-9 px-3 bg-white hover:bg-gray-100 text-slate-900 rounded-lg transition-colors shadow-md"
                                title="Acciones"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" style={{ backgroundColor: cardBgColor, color: cardTextColor, borderColor: cardTextColor }}>
                              <DropdownMenuItem onClick={() => setEditTypeOpen(t.id as string)}>
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
                                    <AlertDialogTitle style={{ color: dialogTextColor }}>Eliminar Tipo de Documento</AlertDialogTitle>
                                    <AlertDialogDescription style={{ color: dialogTextColor }}>
                                      Esta accion no se puede deshacer. Los documentos de este tipo quedaran sin categoria.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="flex gap-3 justify-end">
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => {
                                        startTransition(async () => {
                                          try {
                                            await deleteDocumentType(t.id as string)
                                          } catch (err) {
                                            console.error("[v0] Error deleting document type:", err)
                                          }
                                        })
                                      }} 
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </div>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {/* Edit Type Dialog - Moved outside DropdownMenu */}
                          <Dialog open={editTypeOpen === t.id} onOpenChange={(v) => !v && setEditTypeOpen(null)}>
                            <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }}>
                              <DialogHeader>
                                <DialogTitle style={{ color: dialogTextColor }}>Editar Tipo de Documento</DialogTitle>
                                <DialogDescription style={{ color: dialogTextColor }}>Modifica los detalles del tipo</DialogDescription>
                              </DialogHeader>
                              <form
                                onSubmit={async (e) => {
                                  e.preventDefault()
                                  const fd = new FormData()
                                  fd.set("id", t.id as string)
                                  fd.set("name", (e.currentTarget.elements.namedItem("name") as HTMLInputElement).value)
                                  fd.set("description", (e.currentTarget.elements.namedItem("description") as HTMLTextAreaElement).value)
                                  
                                  startTransition(async () => {
                                    try {
                                      await updateDocumentType(fd)
                                      setEditTypeOpen(null)
                                    } catch (err) {
                                      console.error("[v0] Error updating document type:", err)
                                    }
                                  })
                                }}
                                className="flex flex-col gap-4"
                              >
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="edit_type_name" style={{ color: dialogTextColor }}>Nombre</Label>
                                  <Input id="edit_type_name" name="name" defaultValue={t.name as string} required style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor="edit_type_desc" style={{ color: dialogTextColor }}>Descripcion</Label>
                                  <Textarea id="edit_type_desc" name="description" defaultValue={(t.description as string) || ""} style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
                                </div>
                                <Button type="submit" disabled={isPending} className="w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">{isPending ? "Guardando..." : "Guardar Cambios"}</Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
