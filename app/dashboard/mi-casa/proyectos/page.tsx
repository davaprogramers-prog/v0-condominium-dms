import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserCondoId } from "@/lib/supabase/owner-utils"
import { Hammer, TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function ProyectosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Get condo_id using utility function to avoid RLS issues
  const condoId = await getUserCondoId(supabase, user.id)

  if (!condoId) redirect("/dashboard/mi-casa")

  // Get projects for this condominium
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("condo_id", condoId)
    .order("start_date", { ascending: false })

  const activeProjects = projects?.filter(p => p.status === "active") || []
  const completedProjects = projects?.filter(p => p.status === "completed") || []
  const plannedProjects = projects?.filter(p => p.status === "planned") || []

  const statusConfig: { [key: string]: { label: string; icon: any; color: string } } = {
    "active": { label: "En Progreso", icon: Clock, color: "bg-blue-100 text-blue-800" },
    "completed": { label: "Completado", icon: CheckCircle, color: "bg-green-100 text-green-800" },
    "planned": { label: "Planificado", icon: TrendingUp, color: "bg-amber-100 text-amber-800" }
  }

  const renderProjects = (projectList: any[], title: string, icon: any) => {
    if (projectList.length === 0) return null

    const IconComponent = icon
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <IconComponent className="h-5 w-5" />
          {title} ({projectList.length})
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {projectList.map((project) => {
            const config = statusConfig[project.status] || statusConfig["planned"]
            return (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </div>
                    <Badge className={config.color}>{config.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.budget && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Presupuesto: <span className="font-semibold">${project.budget.toLocaleString("es-CL")}</span></p>
                    </div>
                  )}
                  {project.start_date && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">
                        Inicio: {new Date(project.start_date).toLocaleDateString("es-CL")}
                      </p>
                    </div>
                  )}
                  {project.end_date && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">
                        Fin estimado: {new Date(project.end_date).toLocaleDateString("es-CL")}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Hammer className="h-8 w-8" />
          Proyectos
        </h1>
        <p className="text-muted-foreground">Proyectos activos del condominio</p>
      </div>

      {projects && projects.length > 0 ? (
        <div className="space-y-8">
          {renderProjects(activeProjects, "En Progreso", Clock)}
          {renderProjects(plannedProjects, "Planificados", TrendingUp)}
          {renderProjects(completedProjects, "Completados", CheckCircle)}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No hay proyectos disponibles en el condominio</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
