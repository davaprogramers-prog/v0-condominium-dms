import { createClient } from "@/lib/supabase/server"
import { Building2 } from "lucide-react"
import { CreateCondoDialog } from "./create-condo-dialog"
import { CondoList } from "./condo-list"

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
    .select("role")

  const stats = {
    condos: condos?.length || 0,
    users: allProfiles?.length || 0,
    admins: (allProfiles || []).filter(p => p.role === "admin").length,
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Panel Super Admin</h1>
        <p className="text-muted-foreground">Gestión general del sistema - Selecciona un condominio para gestionar sus administradores</p>
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

        <CondoList condos={condos || []} currentCondoId={profile?.condo_id} />
      </div>
    </div>
  )
}
