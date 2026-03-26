"use client"

import { useState } from "react"
import { uploadBankStatement } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/file-upload"
import { Plus, Landmark, ExternalLink } from "lucide-react"

interface CartolasClientProps {
  statements: Record<string, unknown>[]
  isAdmin: boolean
}

export function CartolasClient({ statements, isAdmin }: CartolasClientProps) {
  const [openNew, setOpenNew] = useState(false)
  const [fileUrl, setFileUrl] = useState("")

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
                        <a
                          href={stmt.file_url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />Ver PDF
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
