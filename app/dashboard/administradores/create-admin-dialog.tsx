"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface CreateAdminDialogProps {
  condoId: string
  condoName: string
}

export function CreateAdminDialog({ condoId, condoName }: CreateAdminDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const firstName = formData.get("first_name") as string
    const lastName = formData.get("last_name") as string
    const password = formData.get("password") as string

    if (!email || !firstName || !password) {
      setError("Todos los campos son requeridos")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setLoading(false)
      return
    }

    try {
      const { createAdmin } = await import("./actions")
      const result = await createAdmin({
        email,
        password,
        firstName,
        lastName,
        condoId,
      })

      if (!result.success) {
        if (result.error?.includes("already registered")) {
          setError("Este correo ya está registrado")
        } else {
          setError(result.error || "Error al crear el administrador")
        }
        setLoading(false)
        return
      }

      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError("Error al crear el administrador")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
          <UserPlus className="h-5 w-5 mr-2" />
          Crear Administrador
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">Crear Administrador</DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Crea un nuevo administrador para {condoName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-200 border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-slate-900 dark:text-slate-200">Nombre *</Label>
              <Input 
                id="first_name" 
                name="first_name" 
                required 
                className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-slate-900 dark:text-slate-200">Apellido</Label>
              <Input 
                id="last_name" 
                name="last_name"
                className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-900 dark:text-slate-200">Correo electrónico *</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              required 
              className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-900 dark:text-slate-200">Contraseña *</Label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              minLength={6} 
              required 
              className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            <p className="text-xs text-slate-600 dark:text-slate-400">Mínimo 6 caracteres</p>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Administrador
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
