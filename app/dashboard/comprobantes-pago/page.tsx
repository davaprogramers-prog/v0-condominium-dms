import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default async function ProofsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Get user profile with condo and role
  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id, role")
    .eq("id", user.id)
    .single()

  if (!profile?.condo_id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No tienes un condominio asignado.</p>
      </div>
    )
  }

  // Get condo currency
  const { data: condo } = await supabase
    .from("condominiums")
    .select("currency_symbol")
    .eq("id", profile.condo_id)
    .single()

  const currencySymbol = condo?.currency_symbol || "$"

  // Get all payment proofs for this condo (all statuses)
  const { data: allProofs } = await supabase
    .from("payment_proofs")
    .select("*")
    .eq("condo_id", profile.condo_id)
    .order("created_at", { ascending: false })

  // Get all houses for reference
  const { data: houses } = await supabase
    .from("houses")
    .select("*")
    .eq("condo_id", profile.condo_id)

  // Map house IDs to names
  const houseMap = new Map(
    houses?.map((h: any) => [h.id, h.house_number || h.number]) || []
  )

  // Group by status
  const pendingProofs = allProofs?.filter((p) => p.status === "pending") || []
  const approvedProofs = allProofs?.filter((p) => p.status === "approved") || []
  const rejectedProofs = allProofs?.filter((p) => p.status === "rejected") || []

  const ProofCard = ({ proof }: { proof: any }) => {
    const borderColor =
      proof.status === "pending"
        ? "border-orange-500 border-2"
        : proof.status === "approved"
          ? "border-green-500 border-2"
          : "border-red-500 border-2"

    return (
    <Link
      href={`/dashboard/comprobantes-pago/${proof.id}`}
      className={`block p-4 rounded-lg ${borderColor} bg-card hover:bg-accent transition-colors`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="font-medium">Casa #{houseMap.get(proof.house_id)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(proof.created_at).toLocaleDateString("es-CL")}
          </p>
        </div>
        <Badge
          variant={
            proof.status === "pending"
              ? "outline"
              : proof.status === "approved"
                ? "default"
                : "destructive"
          }
        >
          {proof.status === "pending"
            ? "Pendiente"
            : proof.status === "approved"
              ? "Aprobado"
              : "Rechazado"}
        </Badge>
      </div>
      <div className="flex gap-4 text-sm">
        <span>
          Fijo: {currencySymbol}
          {(proof.fixed_amount || 0).toLocaleString("es-CL")}
        </span>
        <span>
          Variable: {currencySymbol}
          {(proof.variable_amount || 0).toLocaleString("es-CL")}
        </span>
        <span>
          Multas: {currencySymbol}
          {(proof.fines_amount || 0).toLocaleString("es-CL")}
        </span>
      </div>
    </Link>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Comprobantes de Pago</h1>
            <p className="text-muted-foreground">Revisar y aprobar pagos de residentes</p>
          </div>
        </div>

        {/* Pending Proofs */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">Por Revisar</h2>
            <Badge variant="outline" className="bg-yellow-50">
              {pendingProofs.length}
            </Badge>
          </div>
          {pendingProofs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingProofs.map((proof) => (
                <ProofCard key={proof.id} proof={proof} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No hay comprobantes pendientes de revisar
            </p>
          )}
        </div>

        {/* Approved Proofs */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">Aprobados</h2>
            <Badge variant="default" className="bg-green-100 text-green-800">
              {approvedProofs.length}
            </Badge>
          </div>
          {approvedProofs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedProofs.map((proof) => (
                <ProofCard key={proof.id} proof={proof} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No hay comprobantes aprobados
            </p>
          )}
        </div>

        {/* Rejected Proofs */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">Rechazados</h2>
            <Badge variant="destructive" className="bg-red-100 text-red-800">
              {rejectedProofs.length}
            </Badge>
          </div>
          {rejectedProofs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rejectedProofs.map((proof) => (
                <ProofCard key={proof.id} proof={proof} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No hay comprobantes rechazados
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
