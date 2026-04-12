"use client"

import { useState } from "react"
import { useTheme } from "../theme-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2, CheckCircle2, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { createConcierge } from "./actions"

interface CreateConciergeDialogProps {
  condoId: string
}

export function CreateConciergeDialog({ condoId }: CreateConciergeDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const router = useRouter()
  const { dialogBgColor, dialogTextColor, inputBgColor, inputTextColor } = useTheme()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string

    try {
      const result = await createConcierge(condoId, {
        email,
        password,
        firstName,
        lastName,
      })

      // Show success message
      const message = result.alreadyExists
        ? `${firstName} ${lastName} ya estaba asignado`
        : result.wasReassigned
          ? `${firstName} ${lastName} ha sido reasignado`
          : `${firstName} ${lastName} ha sido creado`

      setSuccessMessage(message)
      setSuccess(true)

      // Close dialog after 2 seconds
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setSuccessMessage("")
        router.refresh()
      }, 2000)
    } catch (err: any) {
      console.error("[v0] Error creating concierge:", err)
      setError(err.message || "Error al crear conserje")
    } finally {
      setLoading(false)
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
          <Users className="h-5 w-5" />
          Agregar Conserje
        </Button>
      </DialogTrigger>
      <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }}>
        <DialogHeader>
          <DialogTitle style={{ color: dialogTextColor }}>Crear Nuevo Conserje</DialogTitle>
          <DialogDescription style={{ color: dialogTextColor }}>Agrega un nuevo conserje para el condominio</DialogDescription>
        </DialogHeader>

        {success && (
          <div className="animate-in fade-in duration-300 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" style={{ color: dialogTextColor }}>Nombre</Label>
                <Input id="firstName" name="firstName" required style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" style={{ color: dialogTextColor }}>Apellido</Label>
                <Input id="lastName" name="lastName" required style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" style={{ color: dialogTextColor }}>Correo Electrónico</Label>
              <Input id="email" name="email" type="email" required style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" style={{ color: dialogTextColor }}>Contraseña</Label>
              <Input id="password" name="password" type="password" required placeholder="Mínimo 8 caracteres" style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }} />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear Conserje
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
