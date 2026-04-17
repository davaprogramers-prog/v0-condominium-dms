import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CartolasClient } from "./cartolas-client"
import { CreateCartolasDialog } from "./create-cartolas-dialog"
import { Landmark } from "lucide-react"

export default async function CartolasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("condo_id, role").eq("id", user.id).single()
  if (!profile?.condo_id) redirect("/dashboard")

  const { data: statements } = await supabase
    .from("bank_statements")
    .select("*")
    .eq("condo_id", profile.condo_id)
    .order("statement_date", { ascending: false })

  const isAdmin = profile.role === "admin" || profile.role === "super_admin"

  return (
    <div className="space-y-6">
      {/* Subtitle with Icon */}
      <div className="flex items-center gap-2">
        <Landmark className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <p className="text-muted-foreground text-sm">Histórico de cartolas bancarias del condominio</p>
      </div>

      {/* Upload Cartolas Button - Centered */}
      {isAdmin && (
        <div className="flex items-center justify-center">
          <CreateCartolasDialog condoId={profile.condo_id} />
        </div>
      )}

      {/* Cartolas Client Content */}
      <CartolasClient
        statements={statements || []}
        isAdmin={isAdmin}
      />
    </div>
  )
}
