"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserPlus, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Condo {
  id: string
  name: string
}

export function CreateAdminDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [condos, setCondos] = useState<Condo[]>([])
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const fetchCondos = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("condominiums")
        .select("id, name")
        .order("name")
      setCondos(data || [])
    }
    if (open) fetchCondos()
  }, [open])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const firstName = formData.get("first_name") as string
    const lastName = formData.get("last_name") as string
    const condoId = formData.get("condo_id") as string
    const password = formData.get("password") as string

    if (!email || !firstName || !condoId || !password) {
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
      const supabase = createClient()

      // Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: "admin",
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        if (authError.message.includes("already registered")) {
          setError("Este correo ya está registrado")
        } else {
          setError(authError.message)
        }
        setLoading(false)
        return
      }

      if (authData.user) {
        // Update the profile with condo_id and admin role
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: authData.user.id,
            email: email,
            first_name: firstName,
            last_name: lastName,
            role: "admin",
            condo_id: condoId,
          })

        if (profileError) {
          console.error("Profile error:", profileError)
          setError("Error al crear el perfil del administrador")
          setLoading(false)
          return
        }
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
        <Button size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Crear Administrador
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Administrador</DialogTitle>
          <DialogDescription>
            Crea un nuevo administrador y asignalo a un condominio
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre *</Label>
              <Input id="first_name" name="first_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido</Label>
              <Input id="last_name" name="last_name" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico *</Label>
            <Input id="email" name="email" type="email" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña *</Label>
            <Input id="password" name="password" type="password" minLength={6} required />
            <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="condo_id">Condominio *</Label>
            <Select name="condo_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar condominio" />
              </SelectTrigger>
              <SelectContent>
                {condos.map((condo) => (
                  <SelectItem key={condo.id} value={condo.id}>
                    {condo.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Administrador
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
