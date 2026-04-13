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
import { Plus, Landmark, ExternalLink, ArrowUp, Building, Building2, Building2Icon, FileCheck, Icon, Paperclip } from "lucide-react"
import { useTheme } from "@/app/dashboard/theme-context"

interface CartolasClientProps {
  statements: Record<string, unknown>[]
  isAdmin: boolean
  cardBgColor?: string
  cardTextColor?: string
  borderColor?: string
}

export function CartolasClient({ statements, isAdmin, cardBgColor = "#f5f5f5", cardTextColor = "#1f2937", borderColor = "#e5e7eb" }: CartolasClientProps) {
  const [openNew, setOpenNew] = useState(false)
  const [fileUrl, setFileUrl] = useState("")
  const { inputBgColor, inputTextColor, dialogBgColor, dialogTextColor } = useTheme()

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
                <Paperclip className="h-5 w-5" />
                Subir Cartolas
              </Button>


            </DialogTrigger>
            <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }} className="max-w-lg">
              <DialogHeader>
                <DialogTitle style={{ color: dialogTextColor }}>Subir Cartola Bancaria</DialogTitle>
              </DialogHeader>
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
                  <Label htmlFor="stmt_title" style={{ color: dialogTextColor }}>Titulo</Label>
                  <Input id="stmt_title" name="title" placeholder="Ej: Cartola Enero 2026" required style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="statement_date" style={{ color: dialogTextColor }}>Fecha de la Cartola</Label>
                  <Input id="statement_date" name="statement_date" type="date" required style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label style={{ color: dialogTextColor }}>Archivo PDF</Label>
                  <FileUpload bucket="statements" onUpload={setFileUrl} accept="application/pdf,image/*" label="Subir cartola (PDF)" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="stmt_notes" style={{ color: dialogTextColor }}>Notas</Label>
                  <Textarea id="stmt_notes" name="notes" placeholder="Notas opcionales..." style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                </div>
                <Button type="submit" disabled={!fileUrl} className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Guardar Cartola</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card style={{ backgroundColor: cardBgColor, borderColor: borderColor, color: cardTextColor }}>
        <CardHeader>
          <CardTitle className="text-base" style={{ color: cardTextColor }}>Historial de Cartolas</CardTitle>
          <CardDescription style={{ color: cardTextColor, opacity: 0.7 }}>Archivos PDF de cartolas bancarias del condominio</CardDescription>
        </CardHeader>
        <CardContent>
          {statements.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8" style={{ color: cardTextColor, opacity: 0.6 }}>
              <Landmark className="h-10 w-10" />
              <p>No hay cartolas subidas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow style={{ borderColor: borderColor }}>
                    <TableHead style={{ color: cardTextColor }}>Titulo</TableHead>
                    <TableHead style={{ color: cardTextColor }}>Fecha</TableHead>
                    <TableHead style={{ color: cardTextColor }}>Notas</TableHead>
                    <TableHead style={{ color: cardTextColor }}>Subido</TableHead>
                    <TableHead style={{ color: cardTextColor }}>Archivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statements.map((stmt) => (
                    <TableRow key={stmt.id as string} style={{ borderColor: borderColor }}>
                      <TableCell className="font-medium" style={{ color: cardTextColor }}>{stmt.title as string}</TableCell>
                      <TableCell className="text-sm" style={{ color: cardTextColor }}>{stmt.statement_date as string}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm" style={{ color: cardTextColor, opacity: 0.7 }}>
                        {(stmt.notes as string) || "-"}
                      </TableCell>
                      <TableCell className="text-sm" style={{ color: cardTextColor }}>{new Date(stmt.created_at as string).toLocaleDateString("es-CL")}</TableCell>
                      <TableCell>
                        <a
                          href={stmt.file_url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm hover:underline"
                          style={{ color: "#2563eb" }}
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
