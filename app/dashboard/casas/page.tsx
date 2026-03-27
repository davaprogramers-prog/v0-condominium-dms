import { createClient } from "@/lib/supabase/server"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateHouseDialog } from "./create-house-dialog"
import { EditHouseDialog } from "./edit-house-dialog"

export default async function CasasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id, role")
    .eq("id", user?.id)
    .single()

  const { data: housesRaw } = await supabase
    .from("houses")
    .select("*")
    .eq("condo_id", profile?.condo_id)

  // Sort houses numerically by house_number
  const houses = housesRaw?.sort((a, b) => {
    const numA = parseInt(a.house_number?.replace(/\D/g, '') || '0', 10)
    const numB = parseInt(b.house_number?.replace(/\D/g, '') || '0', 10)
    return numA - numB
  })

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Casas</h1>
          <p className="text-muted-foreground">Gestión de propiedades del condominio</p>
        </div>
        {isAdmin && <CreateHouseDialog condoId={profile?.condo_id} />}
      </div>

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left font-semibold"># Casa</th>
                <th className="px-6 py-3 text-left font-semibold">Propietario</th>
                <th className="px-6 py-3 text-left font-semibold">Email</th>
                <th className="px-6 py-3 text-left font-semibold">Estado</th>
                {isAdmin && <th className="px-6 py-3 text-left font-semibold">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {houses?.map((house) => (
                <tr key={house.id} className="border-b hover:bg-muted/50">
                  <td className="px-6 py-3 font-semibold">#{house.house_number}</td>
                  <td className="px-6 py-3">{house.owner_name || "-"}</td>
                  <td className="px-6 py-3 text-muted-foreground text-xs">{house.owner_email || "-"}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      Activo
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-3">
                      <EditHouseDialog
                        houseId={house.id}
                        ownerName={house.owner_name || ""}
                        ownerEmail={house.owner_email || ""}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!houses?.length && (
          <div className="p-6 text-center text-muted-foreground">
            {isAdmin ? "No hay casas registradas. Crea la primera haciendo clic en el botón arriba." : "No hay casas en este condominio"}
          </div>
        )}
      </div>
    </div>
  )
}
