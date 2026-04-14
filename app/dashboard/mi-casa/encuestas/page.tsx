import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserCondoId } from "@/lib/supabase/owner-utils"
import { Vote, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function EncuestasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Get condo_id using utility function to avoid RLS issues
  const condoId = await getUserCondoId(supabase, user.id)

  if (!condoId) redirect("/dashboard/mi-casa")

  // Get surveys for this condominium
  const { data: surveys } = await supabase
    .from("surveys")
    .select("*")
    .eq("condo_id", condoId)
    .order("created_at", { ascending: false })

  const now = new Date()
  const activeSurveys = surveys?.filter(s => new Date(s.end_date) > now) || []
  const closedSurveys = surveys?.filter(s => new Date(s.end_date) <= now) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Vote className="h-8 w-8" />
          Encuestas
        </h1>
        <p className="text-muted-foreground">Participa en las encuestas del condominio</p>
      </div>

      {/* Active Surveys */}
      {activeSurveys.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            Encuestas Activas ({activeSurveys.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {activeSurveys.map((survey) => (
              <Card key={survey.id} className="border-amber-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{survey.title}</CardTitle>
                  <CardDescription>{survey.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm">
                    <p className="text-muted-foreground">
                      Vence: {new Date(survey.end_date).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                  <Button className="w-full">Responder Encuesta</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Closed Surveys */}
      {closedSurveys.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Encuestas Cerradas ({closedSurveys.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {closedSurveys.map((survey) => (
              <Card key={survey.id} className="opacity-75">
                <CardHeader>
                  <CardTitle className="text-lg">{survey.title}</CardTitle>
                  <CardDescription>{survey.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Cerrada: {new Date(survey.end_date).toLocaleDateString("es-CL")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Surveys */}
      {surveys?.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No hay encuestas disponibles en este momento</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
