import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Users } from "lucide-react"
import { CreateAdminDialog } from "./create-admin-dialog"
import { DeleteUserButton } from "./delete-user-button"

export default async function AdministradoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, condo_id")
    .eq("id", user.id)
    .single()

  // Only super_admin can access this page
  if (profile?.role !== "super_admin") {
    redirect("/dashboard")
  }

  const condoId = profile?.condo_id
  if (!condoId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Selecciona un condominio desde el Panel Admin primero.</p>
      </div>
    )
  }

  // Get condo info
  const { data: condo } = await supabase
    .from("condominiums")
    .select("name")
    .eq("id", condoId)
    .single()

  // Get admins for this condo
  const { data: admins } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, created_at")
    .eq("condo_id", condoId)
    .eq("role", "admin")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Administradores</h1>
        <p className="text-muted-foreground">
          Gestión de administradores de {condo?.name || "este condominio"}
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Administradores del Condominio
          </h2>
          <CreateAdminDialog condoId={condoId} condoName={condo?.name || ""} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Fecha de Creación</th>
                <th className="px-4 py-3 text-left font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(admins || []).map((admin) => (
                <tr key={admin.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">
                    {admin.first_name} {admin.last_name || ""}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {admin.email}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(admin.created_at).toLocaleDateString("es-CL")}
                  </td>
                  <td className="px-4 py-3">
                    <DeleteUserButton userId={admin.id} userEmail={admin.email} />
                  </td>
                </tr>
              ))}
              {(!admins || admins.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    No hay administradores registrados para este condominio
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
