import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Vote, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function EncuestasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id, role, house_id")
    .eq("id", user.id)
    .single()
  
  if (!profile?.condo_id) redirect("/dashboard")

  const { data: surveys } = await supabase
    .from("surveys")
    .select("*")
    .eq("condo_id", profile.condo_id)
    .order("created_at", { ascending: false })

  const activeSurveys = surveys?.filter(s => s.status === "activa") || []
  const closedSurveys = surveys?.filter(s => s.status === "cerrada") || []
  const isAdmin = profile.role === "admin"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Encuestas y Votaciones</h1>
          <p className="text-muted-foreground">Participa en las votaciones del condominio</p>
        </div>
        {isAdmin && (
          <Button size="sm" disabled>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Encuesta
          </Button>
        )}
      </div>

      {/* Encuestas Activas */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Encuestas Activas</h2>
        
        {activeSurveys.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {activeSurveys.map((survey) => (
              <div key={survey.id} className="rounded-lg border bg-card p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{survey.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{survey.description}</p>
                  </div>
                  <Vote className="h-5 w-5 text-primary flex-shrink-0" />
                </div>
                <div className="text-xs text-amber-600 font-medium">
                  Cierra: {new Date(survey.closes_at).toLocaleDateString("es-CL")}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center">
            <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No hay encuestas activas en este momento</p>
          </div>
        )}
      </div>

      {/* Encuestas Cerradas */}
      {closedSurveys.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Encuestas Anteriores</h2>
          
          <div className="rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-6 py-3 text-left font-semibold">Título</th>
                    <th className="px-6 py-3 text-left font-semibold">Descripción</th>
                    <th className="px-6 py-3 text-left font-semibold">Cerrada</th>
                  </tr>
                </thead>
                <tbody>
                  {closedSurveys.map((survey) => (
                    <tr key={survey.id} className="border-b hover:bg-muted/50">
                      <td className="px-6 py-3 font-medium">{survey.title}</td>
                      <td className="px-6 py-3 text-muted-foreground text-sm">{survey.description}</td>
                      <td className="px-6 py-3 text-muted-foreground text-sm">{new Date(survey.created_at).toLocaleDateString("es-CL")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
