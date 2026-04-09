import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateHouseDialog } from "./create-house-dialog"
import { EditHouseDialog } from "./edit-house-dialog"
import { getUserCondoId } from "@/lib/supabase/owner-utils"

export default async function CasasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Get condo_id using the helper function (works for both owners and admins)
  const condoId = await getUserCondoId(supabase, user.id)

  if (!condoId) {
    redirect("/dashboard")
  }

  const { data: housesRaw } = await supabase
    .from("houses")
    .select("*")
    .eq("condo_id", condoId)

  // Sort houses numerically by house_number
  const houses = housesRaw?.sort((a, b) => {
    const numA = parseInt(a.house_number?.replace(/\D/g, '') || '0', 10)
    const numB = parseInt(b.house_number?.replace(/\D/g, '') || '0', 10)
    return numA - numB
  })

  const isAdmin = true

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Casas</h1>
          <p className="text-muted-foreground">Gestión de propiedades del condominio</p>
        </div>
        {isAdmin && <CreateHouseDialog condoId={condoId} />}
      </div>

      <div className="rounded-lg border">
        {!houses?.length ? (
          <div className="p-6 text-center text-muted-foreground">
            {isAdmin ? "No hay casas registradas. Crea la primera haciendo clic en el botón arriba." : "No hay casas en este condominio"}
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {houses?.map((house) => {
                return (
                  <div key={house.id} className="rounded-lg border-2 border-slate-600 bg-slate-700 dark:bg-slate-800 p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col gap-4">
                      {/* Header with number and status */}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium uppercase text-slate-300">Casa</p>
                          <h3 className="text-2xl font-bold text-white">#{house.house_number}</h3>
                        </div>
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-white text-green-700">
                          Activo
                        </span>
                      </div>

                      {/* Owner information */}
                      <div>
                        <p className="text-xs font-medium uppercase text-slate-300">Propietario</p>
                        <p className="font-semibold text-white">{house.owner_name || "-"}</p>
                      </div>

                      {/* Email */}
                      <div>
                        <p className="text-xs font-medium uppercase text-slate-300">Email</p>
                        <p className="text-sm truncate text-slate-200">{house.owner_email || "-"}</p>
                      </div>

                      {/* Actions */}
                      {isAdmin && (
                        <EditHouseDialog
                          houseId={house.id}
                          ownerName={house.owner_name || ""}
                          ownerEmail={house.owner_email || ""}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
