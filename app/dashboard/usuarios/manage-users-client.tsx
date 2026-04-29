"use client"

import { useState } from "react"
import { createUser } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Users, Plus } from "lucide-react"
import { useState as useStateDialog } from "react"

interface ManageUsersClientProps {
  houses: Array<{ id: string; house_number: string }> | null
}

export function ManageUsersClient({ houses }: ManageUsersClientProps) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "propietario",
    house_id: "",
  })

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const fd = new FormData()
      fd.append("email", formData.email)
      fd.append("password", formData.password)
      fd.append("first_name", formData.first_name)
      fd.append("last_name", formData.last_name)
      fd.append("role", formData.role)
      if (formData.house_id) fd.append("house_id", formData.house_id)

      await createUser(fd)
      setSuccess(`Usuario ${formData.email} creado exitosamente`)
      setFormData({ email: "", password: "", first_name: "", last_name: "", role: "propietario", house_id: "" })
      setShowForm(false)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Gestión de Usuarios</CardTitle>
          </div>
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
            variant={showForm ? "outline" : "default"}
          >
            <Plus className="mr-1 h-4 w-4" />
            Crear Usuario
          </Button>
        </div>
        <CardDescription>Crea usuarios residentes y arrendatarios</CardDescription>
      </CardHeader>
      <CardContent>
        {success && (
          <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleCreateUser} className="mb-6 flex flex-col gap-4 rounded-lg border p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="first_name">Nombre</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Juan"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="last_name">Apellido</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Pérez"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@ejemplo.com"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="role">Tipo de Usuario</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="propietario">Residente</SelectItem>
                    <SelectItem value="arrendatario">Arrendatario</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.role === "propietario" && houses && houses.length > 0 && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="house_id">Casa (opcional)</Label>
                  <Select value={formData.house_id} onValueChange={(value) => setFormData({ ...formData, house_id: value })}>
                    <SelectTrigger id="house_id">
                      <SelectValue placeholder="Seleccionar casa..." />
                    </SelectTrigger>
                    <SelectContent>
                      {houses.map((house) => (
                        <SelectItem key={house.id} value={house.id}>
                          Casa {house.house_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Usuario
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        <div className="text-sm text-muted-foreground">
          <p className="mb-2 font-semibold">Tipos de Usuarios:</p>
          <ul className="space-y-1 text-xs">
            <li>• <strong>Residente:</strong> Propietario o arrendatario de una casa, puede pagar gastos comunes</li>
            <li>• <strong>Arrendatario:</strong> Inquilino, acceso limitado a información</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
