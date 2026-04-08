import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DocumentosClient } from "./documentos-client"
import { getUserCondoId } from "@/lib/supabase/owner-utils"

export default async function DocumentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Get condo_id using the helper function (works for both owners and admins)
  const condoId = await getUserCondoId(supabase, user.id)

  if (!condoId) redirect("/dashboard")

  // Get profile to check if admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const { data: documents } = await supabase
    .from("documents")
    .select("*, document_types(*)")
    .eq("condo_id", condoId)
    .order("created_at", { ascending: false })

  const { data: documentTypes } = await supabase
    .from("document_types")
    .select("*")
    .eq("condo_id", condoId)
    .order("name")

  return (
    <DocumentosClient
      condoId={condoId}
      documents={documents || []}
      documentTypes={documentTypes || []}
      isAdmin={profile?.role === "admin" || profile?.role === "super_admin"}
    />
  )
}
