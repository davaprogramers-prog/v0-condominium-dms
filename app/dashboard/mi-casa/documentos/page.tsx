import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserCondoId } from "@/lib/supabase/owner-utils"
import { FileText, Download, Eye, AlertCircle, Calendar, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function DocumentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  // Get condo_id using utility function to avoid RLS issues
  const condoId = await getUserCondoId(supabase, user.id)

  if (!condoId) redirect("/dashboard/mi-casa")

  // Get documents shared with this condominium
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("condo_id", condoId)
    .order("created_at", { ascending: false })

  const categoryIcons: { [key: string]: string } = {
    "reglamento": "Reglamento",
    "acta": "Acta",
    "presupuesto": "Presupuesto",
    "contrato": "Contrato",
    "informe": "Informe",
    "otro": "Documento",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Documentos
        </h1>
        <p className="text-muted-foreground">Tus documentos y registros disponibles</p>
      </div>

      {documents && documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{doc.title}</h3>
                    {doc.description && (
                      <p className="text-sm text-muted-foreground mb-3">{doc.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {doc.created_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(doc.created_at).toLocaleDateString("es-CL")}
                        </span>
                      )}
                      {doc.created_by && (
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {doc.created_by}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {doc.file_url && (
                      <>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Descargar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No hay documentos disponibles en este momento</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
