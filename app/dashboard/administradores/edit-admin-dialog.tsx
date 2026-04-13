'use client'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pencil, Loader2 } from "lucide-react"
import { updateAdminHouse } from "./actions"
import { useRouter } from "next/navigation"

interface EditAdminDialogProps {
  adminId: string
  adminEmail: string
  currentHouseId?: string
  houses: any[]
  condoId: string
}

export function EditAdminDialog({ adminId, adminEmail, currentHouseId, houses, condoId }: EditAdminDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedHouse, setSelectedHouse] = useState<string | null>(currentHouseId || null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    if (selectedHouse === null || selectedHouse === "") {
      alert("Por favor selecciona una propiedad")
      return
    }

    setLoading(true)
    try {
      const result = await updateAdminHouse(adminId, selectedHouse)
      
      if (result.success) {
        setOpen(false)
        router.refresh()
      } else {
        alert("Error: " + result.error)
      }
    } catch (error) {
      alert("Error al actualizar: " + String(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          variant="outline"
          className="border-gray-300 hover:bg-gray-100"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar Administrador</DialogTitle>
          <DialogDescription>
            Asigna una propiedad al administrador {adminEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Propiedad</label>
            <Select value={selectedHouse || ""} onValueChange={(value) => setSelectedHouse(value || null)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar propiedad" />
              </SelectTrigger>
              <SelectContent>
                {houses.map((house) => (
                  <SelectItem key={house.id} value={house.id}>
                    Casa #{house.house_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-600">
              Selecciona una propiedad para que el admin pueda verla en Mi Casa
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || !selectedHouse}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
