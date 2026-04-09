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
    role: user.role || "propietario",
    condo_id: user.condo_id || "",
    house_id: user.house_id || "",
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
      setHouses(data.houses || [])
    } catch (err) {
      console.error("[v0] Error loading houses:", err)
      setError("Error al cargar las casas")
    } finally {
      setLoadingHouses(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

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
      console.error("[v0] Error updating user:", err)
    } finally {
      setLoading(false)
    }
  }

  const isSuperAdmin = user.role === "super_admin"
  const needsProperty = formData.role === "propietario"

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

          <div>
            <Label htmlFor="role">Rol *</Label>
            <Select value={formData.role} onValueChange={(role) => setFormData({ ...formData, role })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="conserje">Conserje</SelectItem>
                <SelectItem value="propietario">Propietario</SelectItem>
                <SelectItem value="arrendatario">Arrendatario</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role !== "arrendatario" && (
            <div>
              <Label htmlFor="condo">Condominio *</Label>
              <Select
                value={formData.condo_id}
                onValueChange={handleCondoChange}
                disabled={!condos.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar condominio..." />
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
          )}

          {needsProperty && formData.condo_id && (
            <div>
              <Label htmlFor="house">Casa/Propiedad *</Label>
              <Select
                value={formData.house_id}
                onValueChange={(houseId) => setFormData({ ...formData, house_id: houseId })}
                disabled={loadingHouses || !houses.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingHouses ? "Cargando..." : "Seleccionar casa..."} />
                </SelectTrigger>
                <SelectContent>
                  {houses.map((house) => (
                    <SelectItem key={house.id} value={house.id}>
                      {house.house_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || (needsProperty && !formData.house_id)}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
