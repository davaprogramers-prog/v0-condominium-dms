"use client"

import { useState } from "react"
import { uploadDocument, createDocumentType, updateDocument, deleteDocument } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/file-upload"
import { Plus, FileText, ExternalLink, MoreHorizontal, Edit2, Trash2 } from "lucide-react"

interface DocumentosClientProps {
  documents: Record<string, unknown>[]
  documentTypes: Record<string, unknown>[]
  isAdmin: boolean
}

export function DocumentosClient({ documents, documentTypes, isAdmin }: DocumentosClientProps) {
  const [openDoc, setOpenDoc] = useState(false)
  const [openType, setOpenType] = useState(false)
  const [selectedType, setSelectedType] = useState("")
  const [fileUrl, setFileUrl] = useState("")
  const [editOpen, setEditOpen] = useState<string | null>(null)
  const [editFileUrl, setEditFileUrl] = useState("")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documentos</h1>
          <p className="text-sm text-muted-foreground">{documents.length} documentos almacenados</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Dialog open={openType} onOpenChange={setOpenType}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" />Tipo</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nuevo Tipo de Documento</DialogTitle></DialogHeader>
                <form action={async (fd) => { await createDocumentType(fd); setOpenType(false) }} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="doc_type_name">Nombre</Label>
                    <Input id="doc_type_name" name="name" placeholder="Ej: Reglamento, Sancion, Parte..." required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="doc_type_desc">Descripcion</Label>
                    <Textarea id="doc_type_desc" name="description" placeholder="Descripcion del tipo..." />
                  </div>
                  <Button type="submit">Guardar Tipo</Button>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={openDoc} onOpenChange={setOpenDoc}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Subir Documento</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Subir Documento</DialogTitle></DialogHeader>
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
                    <Label>Tipo de Documento</Label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((t) => (
                          <SelectItem key={t.id as string} value={t.id as string}>
                            {t.name as string}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="doc_title">Titulo</Label>
                    <Input id="doc_title" name="title" placeholder="Titulo del documento" required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="doc_desc">Descripcion</Label>
                    <Textarea id="doc_desc" name="description" placeholder="Descripcion opcional..." />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Archivo</Label>
                    <FileUpload bucket="documents" onUpload={setFileUrl} accept="image/*,application/pdf" label="Subir archivo (PDF o imagen)" />
                  </div>
                  <Button type="submit" disabled={!fileUrl}>Guardar Documento</Button>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documentos del Condominio</CardTitle>
              <CardDescription>Reglamentos, partes, sanciones y otros documentos</CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
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
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setEditFileUrl(doc.file_url as string); setEditOpen(doc.id as string) }}>
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
                                        <AlertDialogTitle>Eliminar Documento</AlertDialogTitle>
                                        <AlertDialogDescription>
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
                                <DialogContent>
                                  <DialogHeader><DialogTitle>Editar Documento</DialogTitle></DialogHeader>
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
                                      <Label htmlFor="edit_title">Titulo</Label>
                                      <Input id="edit_title" name="title" defaultValue={doc.title as string} required />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <Label htmlFor="edit_desc">Descripcion (max 500 caracteres)</Label>
                                      <Textarea id="edit_desc" name="description" defaultValue={(doc.description as string) || ""} maxLength={500} rows={3} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      <Label>Cambiar archivo (opcional)</Label>
                                      <FileUpload bucket="documents" onUpload={setEditFileUrl} accept="application/pdf" label="Subir nuevo PDF" />
                                    </div>
                                    <Button type="submit">Guardar Cambios</Button>
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
                        {t.description && <p className="text-xs text-muted-foreground">{t.description as string}</p>}
                      </div>
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
