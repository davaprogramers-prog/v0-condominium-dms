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
import { Checkbox } from "@/components/ui/checkbox"
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
    role: "admin",
    condo_id: "",
    house_id: "",
    is_owner: false,
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

    // Propietarios requieren una propiedad
    if (formData.role === "propietario" && !formData.house_id) {
      setError("Debes seleccionar una propiedad para un propietario")
      setLoading(false)
      return
    }

    // Otros roles que también son propietarios requieren una propiedad
    if (formData.is_owner && !formData.house_id) {
      setError("Debes seleccionar una propiedad si también es propietario")
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
        isOwner: formData.is_owner,
      })

      if (!result.success) {
        // Handle specific Supabase errors with user-friendly messages
        let errorMessage = result.error || "Error al crear el usuario"
        
        // Only show "recently deleted" message if it specifically mentions a recently deleted user
        // "User not allowed" can mean different things, so we need to be more specific
        if (errorMessage.includes("recently deleted") || errorMessage.includes("still being processed")) {
          errorMessage = "Este correo fue eliminado recientemente. Por favor, espera 24 horas o usa un correo diferente."
        } else if (errorMessage.includes("already registered")) {
          errorMessage = "Este correo ya está registrado en el sistema"
        } else if (errorMessage.includes("User not allowed")) {
          // Generic "User not allowed" - could be various reasons
          errorMessage = "No se pudo crear este usuario. Por favor, verifica los datos e intenta de nuevo."
        }
        
        setError(errorMessage)
        setLoading(false)
        return
      }

      setOpen(false)
      setError("")
      setFormData({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "admin",
        condo_id: formData.condo_id,
        house_id: "",
        is_owner: false,
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
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg font-semibold">
          <UserPlus className="h-5 w-5 mr-2" />
          Crear Usuario
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">Crear Usuario</DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Crea un nuevo usuario con rol específico
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-2 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-600 p-4 text-sm text-white border border-red-700 font-semibold">
              {error}
            </div>
          )}

          {isSuperAdmin && (
            <div className="space-y-2">
              <Label htmlFor="condo_id" className="text-slate-900 dark:text-slate-200">Condominio *</Label>
              <Select value={formData.condo_id} onValueChange={handleCondoChange}>
                <SelectTrigger id="condo_id" className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                  <SelectValue placeholder="Seleccionar condominio..." />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700">
                  {condos?.map((condo) => (
                    <SelectItem key={condo.id} value={condo.id} className="dark:text-white">
                      {condo.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-slate-900 dark:text-slate-200">Nombre *</Label>
              <Input 
                id="first_name" 
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required 
                className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-slate-900 dark:text-slate-200">Apellido</Label>
              <Input 
                id="last_name" 
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-900 dark:text-slate-200">Correo electrónico *</Label>
            <Input 
              id="email" 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required 
              className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-900 dark:text-slate-200">Contraseña *</Label>
            <Input 
              id="password" 
              type="password" 
              minLength={6} 
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required 
              className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            <p className="text-xs text-slate-600 dark:text-slate-400">Mínimo 6 caracteres</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-slate-900 dark:text-slate-200">Rol *</Label>
            <Select value={formData.role} onValueChange={(value) => {
              // Si cambia a propietario, auto-activar is_owner y limpiar
              if (value === "propietario") {
                setFormData({ ...formData, role: value, is_owner: true })
              } else {
                setFormData({ ...formData, role: value })
              }
            }}>
              <SelectTrigger id="role" className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700">
                <SelectItem value="admin" className="dark:text-white">Administrador</SelectItem>
                <SelectItem value="conserje" className="dark:text-white">Conserje</SelectItem>
                <SelectItem value="propietario" className="dark:text-white">Propietario</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role !== "propietario" && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is_owner"
                checked={formData.is_owner}
                onCheckedChange={(checked) => setFormData({ ...formData, is_owner: checked as boolean })}
              />
              <Label htmlFor="is_owner" className="font-normal text-slate-900 dark:text-slate-200">
                También es Propietario
              </Label>
            </div>
          )}

          {(formData.is_owner || formData.role === "propietario") && houses.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="house_id" className="text-slate-900 dark:text-slate-200">Propiedad *</Label>
              <Select value={formData.house_id} onValueChange={(value) => setFormData({ ...formData, house_id: value })}>
                <SelectTrigger id="house_id" disabled={loadingHouses} className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                  <SelectValue placeholder={loadingHouses ? "Cargando..." : "Seleccionar propiedad..."} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700">
                  {houses.map((house) => (
                    <SelectItem key={house.id} value={house.id} className="dark:text-white">
                      Casa {house.house_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(formData.is_owner || formData.role === "propietario") && !formData.house_id && (
                <p className="text-xs text-destructive">La propiedad es requerida</p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-6" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear Usuario
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
