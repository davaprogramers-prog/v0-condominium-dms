'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Building2, MoreVertical, Trash2, Edit } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function SuperAdminDashboard({ user }: { user: any }) {
  const router = useRouter()
  const [condos, setCondos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [formData, setFormData] = useState({ name: "", country: "", city: "" })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchCondos()
  }, [])

  async function fetchCondos() {
    try {
      setLoading(true)
      const res = await fetch("/api/super-admin/condos")
      if (!res.ok) throw new Error("Error al cargar condominios")
      const data = await res.json()
      setCondos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCondo(e: React.FormEvent) {
    e.preventDefault()
    try {
      setSubmitting(true)
      const res = await fetch("/api/super-admin/condos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error("Error al crear condominio")
      setFormData({ name: "", country: "", city: "" })
      setCreateOpen(false)
      await fetchCondos()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteCondo(condoId: string) {
    if (!confirm("¿Estás seguro de que deseas eliminar este condominio?")) return
    try {
      const res = await fetch(`/api/super-admin/condos/${condoId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Error al eliminar condominio")
      await fetchCondos()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Panel de Super Administrador</h1>
            <p className="text-muted-foreground">Gestiona condominios del sistema</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Crear Condominio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear nuevo condominio</DialogTitle>
                <DialogDescription>
                  Ingresa los datos del nuevo condominio
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCondo} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    placeholder="Ej: Condominios Los Aromos"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      placeholder="Ej: Chile"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      placeholder="Ej: Santiago"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Creando..." : "Crear"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Condos List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Condominios ({condos.length})</h2>
        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : condos.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No hay condominios creados aún</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {condos.map((condo) => (
              <div key={condo.id} className="rounded-lg border bg-card p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <h3 className="font-semibold">{condo.name}</h3>
                    {condo.city && <p className="text-sm text-muted-foreground">{condo.city}, {condo.country}</p>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/super-admin/condos/${condo.id}`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteCondo(condo.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>ID: {condo.id}</p>
                  {condo.created_at && (
                    <p>Creado: {new Date(condo.created_at).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
