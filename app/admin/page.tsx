import { createClient } from "@/lib/supabase/server"
import { Building2, Users, Trash2 } from "lucide-react"
import { CreateCondoDialog } from "./create-condo-dialog"
import { CreateAdminDialog } from "./create-admin-dialog"
import { CondoList } from "./condo-list"
import { DeleteUserButton } from "./delete-user-button"

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: condos } = await supabase
    .from("condominiums")
    .select("id, name, created_at")
    .order("created_at", { ascending: false })

  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id")
    .eq("id", user?.id || "")
    .single()

  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, role, condo_id, created_at")
    .order("created_at", { ascending: false })

  // Get condo names for admins
  const admins = (allProfiles || []).filter(p => p.role === "admin")
  const condoMap = new Map((condos || []).map(c => [c.id, c.name]))

  const stats = {
    condos: condos?.length || 0,
    users: allProfiles?.length || 0,
    admins: admins.length,
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

      {/* Administradores */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Administradores
          </h2>
          <CreateAdminDialog />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Condominio</th>
                <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">
                    {admin.first_name} {admin.last_name || ""}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {admin.email}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {condoMap.get(admin.condo_id) || "Sin asignar"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">
                    {new Date(admin.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <DeleteUserButton userId={admin.id} userEmail={admin.email} />
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    No hay administradores registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

        <CondoList condos={condos || []} currentCondoId={profile?.condo_id} />
      </div>
    </div>
  )
}
