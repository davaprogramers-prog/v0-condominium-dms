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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createUserWithRole } from "./actions"

interface CreateUserDialogProps {
  condos: Array<{ id: string; name: string }> | null
  isSuperAdmin: boolean
}

export function CreateUserDialog({ condos, isSuperAdmin }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [houses, setHouses] = useState<Array<{ id: string; house_number: string }>>([])
  const [loadingHouses, setLoadingHouses] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "propietario",
    condo_id: "",
    house_id: "",
  })

  const handleCondoChange = async (condoId: string) => {
    setFormData({ ...formData, condo_id: condoId, house_id: "" })
    
    if (!condoId) {
      setHouses([])
      return
    }

    setLoadingHouses(true)
    try {
      const response = await fetch(`/api/condos/${condoId}/houses`)
      const data = await response.json()
      setHouses(data || [])
    } catch (err) {
      console.error("Error loading houses:", err)
      setHouses([])
    } finally {
      setLoadingHouses(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.email || !formData.first_name || !formData.password) {
      setError("Email, nombre y contraseña son requeridos")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setLoading(false)
      return
    }

    if (isSuperAdmin && !formData.condo_id) {
      setError("Debes seleccionar un condominio")
      setLoading(false)
      return
    }

    try {
      const result = await createUserWithRole({
        email: formData.email,
        password: formData.password,
        firstName: formData.first_name,
        lastName: formData.last_name,
        role: formData.role,
        condoId: formData.condo_id,
        houseId: formData.house_id || null,
      })

      if (!result.success) {
        setError(result.error || "Error al crear el usuario")
        setLoading(false)
        return
      }

      setOpen(false)
      setFormData({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "propietario",
        condo_id: "",
        house_id: "",
      })
      router.refresh()
    } catch (err) {
      console.error(err)
      setError("Error al crear el usuario")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Crear Usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear Usuario</DialogTitle>
          <DialogDescription>
            Crea un nuevo usuario con rol específico
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {isSuperAdmin && (
            <div className="space-y-2">
              <Label htmlFor="condo_id">Condominio *</Label>
              <Select value={formData.condo_id} onValueChange={handleCondoChange}>
                <SelectTrigger id="condo_id">
                  <SelectValue placeholder="Seleccionar condominio..." />
                </SelectTrigger>
                <SelectContent>
                  {condos?.map((condo) => (
                    <SelectItem key={condo.id} value={condo.id}>
                      {condo.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre *</Label>
              <Input 
                id="first_name" 
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido</Label>
              <Input 
                id="last_name" 
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico *</Label>
            <Input 
              id="email" 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña *</Label>
            <Input 
              id="password" 
              type="password" 
              minLength={6} 
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required 
            />
            <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol *</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="propietario">Propietario</SelectItem>
                <SelectItem value="arrendatario">Arrendatario</SelectItem>
                <SelectItem value="conserje">Conserje</SelectItem>
                {isSuperAdmin && <SelectItem value="admin">Administrador</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          {(formData.role === "propietario" || formData.role === "conserje") && houses.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="house_id">Propiedad {formData.role === "propietario" ? "*" : "(opcional)"}</Label>
              <Select value={formData.house_id} onValueChange={(value) => setFormData({ ...formData, house_id: value })}>
                <SelectTrigger id="house_id" disabled={loadingHouses}>
                  <SelectValue placeholder={loadingHouses ? "Cargando..." : "Seleccionar propiedad..."} />
                </SelectTrigger>
                <SelectContent>
                  {houses.map((house) => (
                    <SelectItem key={house.id} value={house.id}>
                      Casa {house.house_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.role === "propietario" && !formData.house_id && (
                <p className="text-xs text-destructive">La propiedad es requerida para propietarios</p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Usuario
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
