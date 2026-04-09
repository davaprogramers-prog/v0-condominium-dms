'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { updateUser } from "./actions"

interface EditUserDialogProps {
  user: any
  condos: Array<{ id: string; name: string }>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditUserDialog({ user, condos, open, onOpenChange }: EditUserDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [houses, setHouses] = useState<Array<{ id: string; house_number: string }>>([])
  const [loadingHouses, setLoadingHouses] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    role: user.role || "admin",
    condo_id: user.condo_id || "",
    house_id: user.house_id || "",
    is_owner: user.is_owner || false,
  })

  useEffect(() => {
    // Load houses when dialog opens or condo changes
    const loadHouses = async () => {
      if (!formData.condo_id) {
        setHouses([])
        return
      }

      setLoadingHouses(true)
      try {
        const response = await fetch(`/api/condos/${formData.condo_id}/houses`)
        const data = await response.json()
        setHouses(data || [])
      } catch (err) {
        console.error("Error loading houses:", err)
        setHouses([])
      } finally {
        setLoadingHouses(false)
      }
    }

    if (open) {
      loadHouses()
    }
  }, [open, formData.condo_id])

  const handleCondoChange = (condoId: string) => {
    setFormData({ ...formData, condo_id: condoId, house_id: "" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (formData.is_owner && !formData.house_id) {
      setError("Debes seleccionar una propiedad si es propietario")
      setLoading(false)
      return
    }

    try {
      const result = await updateUser(user.id, formData)

      if (result.error) {
        setError(result.error)
        return
      }

      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError("Error al actualizar usuario")
      console.error("Error updating user:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Actualiza los datos del usuario
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Nombre *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Apellido</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div>
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

          <div>
            <Label htmlFor="role">Rol *</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="conserje">Conserje</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_owner"
              checked={formData.is_owner}
              onCheckedChange={(checked) => setFormData({ ...formData, is_owner: checked as boolean })}
            />
            <Label htmlFor="is_owner" className="font-normal">
              También es Propietario
            </Label>
          </div>

          {formData.is_owner && houses.length > 0 && (
            <div>
              <Label htmlFor="house_id">Propiedad *</Label>
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
              {formData.is_owner && !formData.house_id && (
                <p className="text-xs text-destructive">La propiedad es requerida si es propietario</p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
