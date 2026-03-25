import { createClient } from "@/lib/supabase/server"

export default async function CasasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id")
    .eq("id", user?.id)
    .single()

  const { data: houses } = await supabase
    .from("houses")
    .select("*")
    .eq("condo_id", profile?.condo_id)
    .order("house_number")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Casas</h1>
        <p className="text-muted-foreground">Gestión de propiedades del condominio</p>
      </div>

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left font-semibold">Casa</th>
                <th className="px-6 py-3 text-left font-semibold">Propietario</th>
                <th className="px-6 py-3 text-left font-semibold">Email</th>
                <th className="px-6 py-3 text-left font-semibold">Teléfono</th>
                <th className="px-6 py-3 text-left font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {houses?.map((house) => (
                <tr key={house.id} className="border-b hover:bg-muted/50">
                  <td className="px-6 py-3">Casa #{house.house_number}</td>
                  <td className="px-6 py-3">{house.owner_name || "-"}</td>
                  <td className="px-6 py-3 text-muted-foreground text-xs">{house.owner_email || "-"}</td>
                  <td className="px-6 py-3 text-muted-foreground">{house.owner_phone || "-"}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      Activo
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!houses?.length && (
          <div className="p-6 text-center text-muted-foreground">
            No hay casas registradas aún
          </div>
        )}
      </div>
    </div>
  )
}
