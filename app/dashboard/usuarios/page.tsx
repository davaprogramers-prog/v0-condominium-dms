import { createClient } from "@/lib/supabase/server"

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id")
    .eq("id", user?.id)
    .single()

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .eq("condo_id", profile?.condo_id)
    .neq("id", user?.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <p className="text-muted-foreground">Gestión de administradores, propietarios y arrendatarios</p>
      </div>

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
                  <td className="px-6 py-3 font-medium">{u.first_name} {u.last_name}</td>
                  <td className="px-6 py-3 text-muted-foreground text-xs">-</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 capitalize">
                      {u.role}
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

