import { createClient } from "@/lib/supabase/server"
import { Users, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateUserDialog } from "./create-user-dialog"

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id, role")
    .eq("id", user?.id)
    .single()

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .eq("condo_id", profile?.condo_id)
    .order("created_at", { ascending: false })

  const isAdmin = profile?.role === "admin"
  const isSuperAdmin = profile?.role === "super_admin"
  
  // Get condos for super_admin selector
  let condos = []
  if (isSuperAdmin) {
    const { data: condosData } = await supabase
      .from("condominiums")
      .select("id, name")
      .order("name")
    condos = condosData || []
  }

  const roleColors: Record<string, string> = {
    super_admin: "bg-red-100 text-red-700",
    admin: "bg-blue-100 text-blue-700",
    conserje: "bg-purple-100 text-purple-700",
    propietario: "bg-green-100 text-green-700",
    arrendatario: "bg-amber-100 text-amber-700",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">Gestión de administradores, propietarios y arrendatarios</p>
        </div>
        {(isAdmin || isSuperAdmin) && (
          <CreateUserDialog condos={condos} isSuperAdmin={isSuperAdmin} />
        )}
      </div>

      {/* Información de Roles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { role: "admin", label: "Administrador", desc: "Gestión completa" },
          { role: "conserje", label: "Conserje", desc: "Gestión de solicitudes" },
          { role: "propietario", label: "Propietario", desc: "Subir comprobantes" },
          { role: "arrendatario", label: "Arrendatario", desc: "Acceso limitado" },
        ].map((item) => (
          <div key={item.role} className="rounded-lg border bg-card p-4">
            <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${roleColors[item.role] || "bg-gray-100 text-gray-700"}`}>
              {item.label}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Lista de Usuarios */}
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left font-semibold">Nombre</th>
                <th className="px-6 py-3 text-left font-semibold">Email</th>
                <th className="px-6 py-3 text-left font-semibold">Rol</th>
                <th className="px-6 py-3 text-left font-semibold">Fecha Registro</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id} className="border-b hover:bg-muted/50">
                  <td className="px-6 py-3 font-medium">{u.first_name} {u.last_name || ""}</td>
                  <td className="px-6 py-3 text-muted-foreground text-xs">{u.email || "-"}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${roleColors[u.role] || "bg-gray-100 text-gray-700"}`}>
                      {u.role?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground text-sm">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!users?.length && (
          <div className="p-6 text-center text-muted-foreground">
            No hay usuarios registrados aún
          </div>
        )}
      </div>
    </div>
  )
}

