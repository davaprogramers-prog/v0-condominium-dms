import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DocumentosClient } from "./documentos-client"

export default async function DocumentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id, role")
    .eq("id", user.id)
    .single()

  if (!profile?.condo_id) redirect("/dashboard")

  const { data: documents } = await supabase
    .from("documents")
    .select("*, document_types(*)")
    .eq("condo_id", profile.condo_id)
    .order("created_at", { ascending: false })

  const { data: documentTypes } = await supabase
    .from("document_types")
    .select("*")
    .eq("condo_id", profile.condo_id)
    .order("name")

  return (
    <DocumentosClient
      documents={documents || []}
      documentTypes={documentTypes || []}
      isAdmin={profile.role === "admin" || profile.role === "super_admin"}
    />
  )
}
