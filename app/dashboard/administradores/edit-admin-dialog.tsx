'use client'

import { useState } from "react"
import { useTheme } from "@/app/dashboard/theme-context"
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
  const { dialogBgColor, dialogTextColor, borderColor, inputBgColor, inputTextColor } = useTheme()

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
          className="border"
          style={{ borderColor: borderColor, backgroundColor: inputBgColor, color: inputTextColor }}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="max-w-sm"
        style={{
          backgroundColor: dialogBgColor,
          color: dialogTextColor,
          borderColor: borderColor
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: dialogTextColor }}>Editar Administrador</DialogTitle>
          <DialogDescription style={{ color: dialogTextColor, opacity: 0.7 }}>
            Asigna una propiedad al administrador {adminEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: dialogTextColor }}>Propiedad</label>
            <Select value={selectedHouse || ""} onValueChange={(value) => setSelectedHouse(value || null)}>
              <SelectTrigger style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}>
                <SelectValue placeholder="Seleccionar propiedad" />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                {houses.map((house) => (
                  <SelectItem key={house.id} value={house.id} style={{ color: inputTextColor }}>
                    Casa #{house.house_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs" style={{ color: dialogTextColor, opacity: 0.6 }}>
              Selecciona una propiedad para que el admin pueda verla en Mi Casa
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              onClick={() => setOpen(false)}
              style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
              className="border"
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
