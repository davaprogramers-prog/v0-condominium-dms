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
        <Button className="gap-2" style={{ backgroundColor: "#2563eb" }}>
          <Plus className="h-4 w-4" />
          Crear Casa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Crear Nueva Casa</DialogTitle>
          <DialogDescription className="text-gray-600">
            Agrega una nueva propiedad al condominio
          </DialogDescription>
        </DialogHeader>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 font-medium">
            ✓ {successMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 font-medium">
            ✕ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="houseNumber" className="text-gray-700 font-semibold mb-2 block">
              Número de Casa
            </Label>
            <Input
              id="houseNumber"
              name="houseNumber"
              placeholder="Ej: Casa 101"
              value={formData.houseNumber}
              onChange={handleInputChange}
              disabled={loading || success}
              className="border-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            <Label htmlFor="ownerName" className="text-gray-700 font-semibold mb-2 block">
              Nombre del Propietario
            </Label>
            <Input
              id="ownerName"
              name="ownerName"
              placeholder="Nombre completo"
              value={formData.ownerName}
              onChange={handleInputChange}
              disabled={loading || success}
              className="border-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            <Label htmlFor="ownerEmail" className="text-gray-700 font-semibold mb-2 block">
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
              className="border-2 border-gray-300 focus:border-blue-500 focus:ring-blue-200 bg-white text-gray-900 placeholder-gray-400"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="px-6 text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || success}
              className="px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
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
