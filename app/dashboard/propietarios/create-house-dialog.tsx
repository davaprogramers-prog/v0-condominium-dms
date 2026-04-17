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
import { Plus, Loader2 } from "lucide-react"
import { createHouse } from "./actions"
import { useRouter } from "next/navigation"
import { useTheme } from "@/app/dashboard/theme-context"

interface CreateHouseDialogProps {
  condoId: string
  onSuccess?: () => void
}

export function CreateHouseDialog({ condoId, onSuccess }: CreateHouseDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const router = useRouter()
  const { dialogBgColor, dialogTextColor, inputBgColor, inputTextColor } = useTheme()

  const [formData, setFormData] = useState({
    houseNumber: "",
    ownerName: "",
    ownerEmail: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.houseNumber || !formData.ownerName || !formData.ownerEmail) {
      setError("Por favor completa todos los campos")
      setLoading(false)
      return
    }

    try {
      const result = await createHouse({
        condo_id: condoId,
        house_number: formData.houseNumber,
        owner_name: formData.ownerName,
        owner_email: formData.ownerEmail,
      })

      if (result.success) {
        setSuccess(true)
        setSuccessMessage(`Casa ${formData.houseNumber} creada exitosamente`)
        setFormData({
          houseNumber: "",
          ownerName: "",
          ownerEmail: "",
        })
        
        // Close dialog after 2 seconds
        setTimeout(() => {
          setOpen(false)
          setSuccess(false)
          setSuccessMessage("")
          router.refresh()
          onSuccess?.()
        }, 2000)
      } else {
        setError(result.error || "Error al crear la casa")
      }
    } catch (err: any) {
      setError(err.message || "Error al crear la casa")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" style={{ backgroundColor: "#2563eb", color: "white" }}>
          <Plus className="h-4 w-4" />
          Crear Casa
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="max-w-md"
        style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: inputTextColor, borderWidth: "1px" }}
      >
        <DialogHeader className="pb-4" style={{ borderBottomColor: inputTextColor, borderBottomWidth: "1px" }}>
          <DialogTitle className="text-2xl font-bold" style={{ color: dialogTextColor }}>Crear Nueva Casa</DialogTitle>
          <DialogDescription style={{ color: dialogTextColor, opacity: 0.7 }} className="mt-2">
            Agrega una nueva propiedad al condominio
          </DialogDescription>
        </DialogHeader>

        {success && (
          <div className="rounded-lg p-4 flex items-start gap-3" style={{ backgroundColor: "#dcfce7", borderColor: "#22c55e", borderWidth: "2px", color: "#166534" }}>
            <span className="text-xl">✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="rounded-lg p-4 flex items-start gap-3" style={{ backgroundColor: "#fee2e2", borderColor: "#ef4444", borderWidth: "2px", color: "#991b1b" }}>
            <span className="text-xl">✕</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="houseNumber" className="font-bold mb-2 block text-sm" style={{ color: dialogTextColor }}>
              Número de Casa
            </Label>
            <Input
              id="houseNumber"
              name="houseNumber"
              placeholder="Ej: Casa 101"
              value={formData.houseNumber}
              onChange={handleInputChange}
              disabled={loading || success}
              style={{
                borderColor: inputTextColor,
                backgroundColor: inputBgColor,
                color: inputTextColor,
              }}
              className="border-2 focus:ring-2 focus:border-opacity-80 font-medium"
            />
          </div>

          <div>
            <Label htmlFor="ownerName" className="font-bold mb-2 block text-sm" style={{ color: dialogTextColor }}>
              Nombre del Propietario
            </Label>
            <Input
              id="ownerName"
              name="ownerName"
              placeholder="Nombre completo"
              value={formData.ownerName}
              onChange={handleInputChange}
              disabled={loading || success}
              style={{
                borderColor: inputTextColor,
                backgroundColor: inputBgColor,
                color: inputTextColor,
              }}
              className="border-2 focus:ring-2 focus:border-opacity-80 font-medium"
            />
          </div>

          <div>
            <Label htmlFor="ownerEmail" className="font-bold mb-2 block text-sm" style={{ color: dialogTextColor }}>
              Email del Propietario
            </Label>
            <Input
              id="ownerEmail"
              name="ownerEmail"
              type="email"
              placeholder="correo@ejemplo.com"
              value={formData.ownerEmail}
              onChange={handleInputChange}
              disabled={loading || success}
              style={{
                borderColor: inputTextColor,
                backgroundColor: inputBgColor,
                color: inputTextColor,
              }}
              className="border-2 focus:ring-2 focus:border-opacity-80 font-medium"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4" style={{ borderTopColor: inputTextColor, borderTopWidth: "1px" }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              style={{ borderColor: inputTextColor, color: dialogTextColor }}
              className="px-6 border-2 font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || success}
              className="px-6 text-white font-bold"
              style={{ backgroundColor: "#2563eb" }}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear Casa
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
