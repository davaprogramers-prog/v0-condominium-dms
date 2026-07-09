'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Building2, MoreVertical, Trash2, Edit, LogIn, Eye, Users } from "lucide-react"
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
import { Card } from "@/components/ui/card"
import Link from "next/link"

export function SuperAdminDashboard({ userEmail }: { userEmail: string }) {
  const router = useRouter()
  const [condos, setCondos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [formData, setFormData] = useState({ name: "", address: "", city: "", country: "" })
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
      setCondos(data.condos || data)
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
      setFormData({ name: "", address: "", city: "", country: "" })
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

  async function enterAsAdmin(condoId: string, condoName: string) {
    // Store the condominium context in localStorage for super_admin
    localStorage.setItem('super_admin_condo_id', condoId)
    localStorage.setItem('super_admin_condo_name', condoName)
    router.push(`/dashboard?condo=${condoId}&mode=super_admin_view`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Panel de Super Administrador</h1>
          <p className="text-lg text-slate-600 mb-2">Gestión de Condominios del Sistema</p>
          <p className="text-sm text-slate-500">Usuario: {userEmail}</p>
        </div>

        {/* Create Button */}
        <div className="mb-8">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Crear Nuevo Condominio
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Condominio</DialogTitle>
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
                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    placeholder="Ej: Calle Principal 123"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      placeholder="Ej: Santiago"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">País</Label>
                    <Input
                      id="country"
                      placeholder="Ej: Chile"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                  {submitting ? "Creando..." : "Crear Condominio"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Condos List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Cargando condominios...</p>
          </div>
        ) : condos.length === 0 ? (
          <Card className="p-12 text-center">
            <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Sin Condominios</h3>
            <p className="text-slate-600">Crea tu primer condominio para comenzar</p>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">Condominios ({condos.length})</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {condos.map((condo) => (
                <Card key={condo.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <h3 className="font-semibold text-slate-900 text-lg">{condo.name}</h3>
                        {condo.address && (
                          <p className="text-sm text-slate-600">{condo.address}</p>
                        )}
                        {condo.city && (
                          <p className="text-sm text-slate-500">{condo.city}, {condo.country}</p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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

                    {condo.created_at && (
                      <div className="text-xs text-slate-500">
                        <p suppressHydrationWarning>Creado: {new Date(condo.created_at).toLocaleDateString("es-CL")}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t border-slate-200">
                      <button
                        onClick={() => enterAsAdmin(condo.id, condo.name)}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded flex items-center justify-center gap-2 transition-colors"
                      >
                        <LogIn className="h-4 w-4" />
                        Entrar
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/administradores?condo=${condo.id}`)}
                        className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded flex items-center justify-center gap-2 transition-colors"
                      >
                        <Users className="h-4 w-4" />
                        Admins
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard?condo=${condo.id}&mode=view`)}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 text-sm font-medium rounded flex items-center justify-center gap-1 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Footer Stats */}
        {condos.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <Building2 className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">{condos.length}</p>
                <p className="text-sm text-slate-600">Condominios</p>
              </Card>
              <Card className="p-4 text-center">
                <div className="h-6 w-6 text-green-600 mx-auto mb-2 flex items-center justify-center">
                  <span className="text-lg font-bold">👥</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{condos.length}</p>
                <p className="text-sm text-slate-600">Total de Administraciones</p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
