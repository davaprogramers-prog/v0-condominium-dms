import { createClient } from "@/lib/supabase/server"
import { Building2, Users } from "lucide-react"
import Link from "next/link"
import { CreateCondoDialog } from "./create-condo-dialog"

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: condos } = await supabase
    .from("condominiums")
    .select("id, name, created_at")
    .order("created_at", { ascending: false })

  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("role")

  const stats = {
    condos: condos?.length || 0,
    users: allProfiles?.length || 0,
    admins: allProfiles?.filter(p => p.role === "admin").length || 0,
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">Gestión general del sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Condominios</p>
          <p className="text-2xl font-bold mt-2">{stats.condos}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Usuarios</p>
          <p className="text-2xl font-bold mt-2">{stats.users}</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Administradores</p>
          <p className="text-2xl font-bold mt-2">{stats.admins}</p>
        </div>
      </div>

      {/* Condominios */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Condominios Registrados
          </h2>
          <CreateCondoDialog />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold">Creado por</th>
                <th className="px-4 py-3 text-left font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {condos?.map((condo) => (
                <tr key={condo.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{condo.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">-</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(condo.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!condos?.length && (
          <div className="p-6 text-center text-muted-foreground">
            No hay condominios registrados
          </div>
        )}
      </div>
    </div>
  )
}
