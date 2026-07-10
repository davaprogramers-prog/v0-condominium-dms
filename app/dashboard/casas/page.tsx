import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateHouseDialog } from "./create-house-dialog"
import { EditHouseDialog } from "./edit-house-dialog"
import { getUserCondoId } from "@/lib/supabase/owner-utils"
import { getContrastTextColor, type CondoTheme, DEFAULT_THEME } from "@/lib/theme-utils"

export default async function CasasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Get user profile with condo and role
  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id, role")
    .eq("id", user.id)
    .single()

  if (!profile?.condo_id) {
    redirect("/dashboard")
  }

  const isAdmin = profile.role === "admin" || profile.role === "super_admin"
  if (!isAdmin) {
    redirect("/dashboard")
  }

  const condoId = profile.condo_id

  // Fetch houses and theme together
  const [housesResponse, themeResponse] = await Promise.all([
    supabase
      .from("houses")
      .select("*")
      .eq("condo_id", condoId),
    supabase
      .from("condominium_themes")
      .select("*")
      .eq("condo_id", condoId)
      .single()
  ])

  const housesRaw = housesResponse.data || []
  const theme = themeResponse.data as CondoTheme | null

  // Determine which colors to use - custom theme if enabled, otherwise defaults
  const cardBgColor = theme?.enable_custom_theme ? theme.card_bg_color : DEFAULT_THEME.card_bg_color
  const cardTextColor = theme?.enable_custom_theme ? theme.card_text_color : DEFAULT_THEME.card_text_color

  // Sort houses numerically by house_number
  const houses = housesRaw?.sort((a, b) => {
    const numA = parseInt(a.house_number?.replace(/\D/g, '') || '0', 10)
    const numB = parseInt(b.house_number?.replace(/\D/g, '') || '0', 10)
    return numA - numB
  })

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">Gestión de propiedades del condominio</p>

      <div className="flex items-center justify-center">
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
                return (
                  <div 
                    key={house.id} 
                    className="rounded-lg border-2 p-4 hover:shadow-md transition-shadow"
                    style={{
                      backgroundColor: cardBgColor,
                      borderColor: cardBgColor,
                      color: cardTextColor
                    }}
                  >
                    <div className="flex flex-col gap-4">
                      {/* Header with number and status */}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium uppercase opacity-75">Casa</p>
                          <h3 className="text-2xl font-bold" style={{ color: cardTextColor }}>#{house.house_number}</h3>
                        </div>
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-white" style={{ color: cardBgColor }}>
                          Activo
                        </span>
                      </div>

                      {/* Owner information */}
                      <div>
                        <p className="text-xs font-medium uppercase opacity-75">Residente</p>
                        <p className="font-semibold" style={{ color: cardTextColor }}>{house.owner_name || "-"}</p>
                      </div>

                      {/* Email */}
                      <div>
                        <p className="text-xs font-medium uppercase opacity-75">Email</p>
                        <p className="text-sm truncate" style={{ color: cardTextColor, opacity: 0.8 }}>{house.owner_email || "-"}</p>
                      </div>

                      {/* Actions */}
                      {isAdmin && (
                        <EditHouseDialog
                          houseId={house.id}
                          houseNumber={house.house_number}
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
