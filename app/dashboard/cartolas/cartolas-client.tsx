"use client"

import { useState, useEffect } from "react"
import { uploadBankStatement } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/file-upload"
import { Plus, Landmark, ExternalLink, X } from "lucide-react"

interface CartolasClientProps {
  statements: Record<string, unknown>[]
  isAdmin: boolean
}

export function CartolasClient({ statements, isAdmin }: CartolasClientProps) {
  const [openNew, setOpenNew] = useState(false)
  const [fileUrl, setFileUrl] = useState("")
  const [viewStatement, setViewStatement] = useState<{ url: string; title: string } | null>(null)

  // Handle ESC key to close viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && viewStatement) {
        setViewStatement(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [viewStatement])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cartolas Bancarias</h1>
          <p className="text-sm text-muted-foreground">{statements.length} cartolas almacenadas</p>
        </div>
        {isAdmin && (
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Subir Cartola</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Subir Cartola Bancaria</DialogTitle></DialogHeader>
              <form
                action={async (fd) => {
                  fd.set("file_url", fileUrl)
                  await uploadBankStatement(fd)
                  setOpenNew(false)
                  setFileUrl("")
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="stmt_title">Titulo</Label>
                  <Input id="stmt_title" name="title" placeholder="Ej: Cartola Enero 2026" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="statement_date">Fecha de la Cartola</Label>
                  <Input id="statement_date" name="statement_date" type="date" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Archivo PDF</Label>
                  <FileUpload bucket="statements" onUpload={setFileUrl} accept="application/pdf,image/*" label="Subir cartola (PDF)" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="stmt_notes">Notas</Label>
                  <Textarea id="stmt_notes" name="notes" placeholder="Notas opcionales..." />
                </div>
                <Button type="submit" disabled={!fileUrl}>Guardar Cartola</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de Cartolas</CardTitle>
          <CardDescription>Archivos PDF de cartolas bancarias del condominio</CardDescription>
        </CardHeader>
        <CardContent>
          {statements.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Landmark className="h-10 w-10" />
              <p>No hay cartolas subidas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titulo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead>Subido</TableHead>
                    <TableHead>Archivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statements.map((stmt) => (
                    <TableRow key={stmt.id as string}>
                      <TableCell className="font-medium">{stmt.title as string}</TableCell>
                      <TableCell className="text-sm">{stmt.statement_date as string}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {(stmt.notes as string) || "-"}
                      </TableCell>
                      <TableCell className="text-sm">{new Date(stmt.created_at as string).toLocaleDateString("es-CL")}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => setViewStatement({ url: stmt.file_url as string, title: stmt.title as string })}
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />Ver PDF
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fullscreen Statement Viewer */}
      {viewStatement && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          <div className="flex-shrink-0 flex items-center justify-between p-3 bg-black/50 border-b border-white/10">
            <h3 className="text-white font-medium text-sm">Cartola - {viewStatement.title}</h3>
            <div className="flex items-center gap-1">
              <a
                href={viewStatement.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white p-2 rounded hover:bg-white/10"
                title="Abrir en nueva pestana"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
              <button
                onClick={() => setViewStatement(null)}
                className="text-white/70 hover:text-white p-2 rounded hover:bg-white/10"
                title="Cerrar (ESC)"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 p-2 overflow-auto">
            {viewStatement.url.toLowerCase().endsWith(".pdf") ? (
              <iframe
                src={viewStatement.url}
                className="w-full h-full min-h-[80vh] rounded-lg bg-white"
                title={`Cartola ${viewStatement.title}`}
              />
            ) : (
              <div className="flex items-center justify-center min-h-full">
                <img
                  src={viewStatement.url}
                  alt={`Cartola ${viewStatement.title}`}
                  className="max-w-full h-auto object-contain rounded-lg"
                  crossOrigin="anonymous"
                />
              </div>
            )}
          </div>
          <div className="flex-shrink-0 p-2 text-center border-t border-white/10">
            <p className="text-white/50 text-xs">Presiona ESC o haz clic en X para cerrar</p>
          </div>
        </div>
      )}
    </div>
  )
}
