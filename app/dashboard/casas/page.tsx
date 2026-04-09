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
              {houses?.map((house, index) => {
                const colors = [
                  { bg: "from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30", border: "border-blue-400", title: "text-blue-900 dark:text-blue-200", text: "text-blue-700 dark:text-blue-300", label: "text-blue-600 dark:text-blue-300" },
                  { bg: "from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30", border: "border-purple-400", title: "text-purple-900 dark:text-purple-200", text: "text-purple-700 dark:text-purple-300", label: "text-purple-600 dark:text-purple-300" },
                  { bg: "from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30", border: "border-green-400", title: "text-green-900 dark:text-green-200", text: "text-green-700 dark:text-green-300", label: "text-green-600 dark:text-green-300" },
                  { bg: "from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30", border: "border-orange-400", title: "text-orange-900 dark:text-orange-200", text: "text-orange-700 dark:text-orange-300", label: "text-orange-600 dark:text-orange-300" },
                  { bg: "from-cyan-50 to-cyan-100 dark:from-cyan-950/30 dark:to-cyan-900/30", border: "border-cyan-400", title: "text-cyan-900 dark:text-cyan-200", text: "text-cyan-700 dark:text-cyan-300", label: "text-cyan-600 dark:text-cyan-300" },
                  { bg: "from-pink-50 to-pink-100 dark:from-pink-950/30 dark:to-pink-900/30", border: "border-pink-400", title: "text-pink-900 dark:text-pink-200", text: "text-pink-700 dark:text-pink-300", label: "text-pink-600 dark:text-pink-300" },
                ]
                const color = colors[index % colors.length]
                
                return (
                  <div key={house.id} className={`rounded-lg border-2 bg-gradient-to-br ${color.bg} ${color.border} p-4 hover:shadow-md transition-shadow`}>
                    <div className="flex flex-col gap-4">
                      {/* Header with number and status */}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`text-xs font-medium uppercase ${color.label}`}>Casa</p>
                          <h3 className={`text-2xl font-bold ${color.title}`}>#{house.house_number}</h3>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-green-200 dark:bg-green-900 text-green-900 dark:text-green-200`}>
                          Activo
                        </span>
                      </div>

                      {/* Owner information */}
                      <div>
                        <p className={`text-xs font-medium uppercase ${color.label}`}>Propietario</p>
                        <p className={`font-semibold ${color.title}`}>{house.owner_name || "-"}</p>
                      </div>

                      {/* Email */}
                      <div>
                        <p className={`text-xs font-medium uppercase ${color.label}`}>Email</p>
                        <p className={`text-sm truncate ${color.text}`}>{house.owner_email || "-"}</p>
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
