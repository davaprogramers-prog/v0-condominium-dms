"use client"

import { useState } from "react"
import { uploadBankStatement } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/file-upload"
import { Paperclip } from "lucide-react"

interface CreateCartolasDialogProps {
  condoId: string
}

export function CreateCartolasDialog({ condoId }: CreateCartolasDialogProps) {
  const [open, setOpen] = useState(false)
  const [fileUrl, setFileUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    try {
      setIsLoading(true)
      formData.set("file_url", fileUrl)
      formData.set("condo_id", condoId)
      await uploadBankStatement(formData)
      setOpen(false)
      setFileUrl("")
    } catch (error) {
      console.error("Error uploading statement:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Subir Cartola Bancaria</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="stmt_title">Título</Label>
            <Input
              id="stmt_title"
              name="title"
              placeholder="Ej: Cartola Enero 2026"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="statement_date">Fecha de la Cartola</Label>
            <Input
              id="statement_date"
              name="statement_date"
              type="date"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Archivo PDF</Label>
            <FileUpload
              bucket="statements"
              onUpload={setFileUrl}
              accept="application/pdf,image/*"
              label="Subir cartola (PDF)"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="stmt_notes">Notas</Label>
            <Textarea
              id="stmt_notes"
              name="notes"
              placeholder="Notas opcionales..."
            />
          </div>
          <Button
            type="submit"
            disabled={!fileUrl || isLoading}
            className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white"
          >
            {isLoading ? "Guardando..." : "Guardar Cartola"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
