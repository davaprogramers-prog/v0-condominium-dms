import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProofApprovalDialog } from "./proof-approval-dialog"

export default async function ProofDetailPage({
  params,
}: {
  params: { proofId: string }
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Get user profile
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

  // Get the proof
  const { data: proof, error: proofError } = await supabase
    .from("payment_proofs")
    .select("*")
    .eq("id", params.proofId)
    .eq("condo_id", profile.condo_id)
    .maybeSingle()

  if (!proof) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Comprobante no encontrado.</p>
      </div>
    )
  }

  // Get house info
  const { data: house } = await supabase
    .from("houses")
    .select("*")
    .eq("id", proof.house_id)
    .single()

  // Get condo info
  const { data: condo } = await supabase
    .from("condominiums")
    .select("currency_symbol")
    .eq("id", profile.condo_id)
    .single()

  const currencySymbol = condo?.currency_symbol || "$"

  // Get parameters for amounts
  const { data: condoParams } = await supabase
    .from("parameters")
    .select("*")
    .eq("condo_id", profile.condo_id)
    .single()

  const fixedAmount = condoParams?.fixed_income_amount || proof.fixed_amount || 0
  const variableAmount = condoParams?.variable_income_amount || proof.variable_amount || 0

  // Get infractions if this is a fines proof
  const { data: infractions } = await supabase
    .from("infractions")
    .select("*")
    .eq("condo_id", profile.condo_id)
    .eq("house_id", proof.house_id)
    .eq("is_paid", false)

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/comprobantes-pago">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Comprobante de Pago</h1>
            <p className="text-muted-foreground">
              Casa #{house?.house_number || house?.number}
            </p>
          </div>
        </div>

        {/* Proof Details */}
        <div className="rounded-lg border bg-card p-6 space-y-6">
          {/* Receipt Image */}
          {proof.receipt_url && (
            <div>
              <h3 className="font-semibold mb-3">Comprobante Enviado</h3>
              <img
                src={proof.receipt_url}
                alt="Comprobante"
                className="max-w-full max-h-96 mx-auto rounded-lg border"
                crossOrigin="anonymous"
              />
            </div>
          )}

          {/* Amount Details */}
          <div className="space-y-3 border-t pt-6">
            <h3 className="font-semibold">Detalles del Pago</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Gasto Fijo</p>
                <p className="text-lg font-semibold">
                  {currencySymbol}
                  {(proof.fixed_amount || 0).toLocaleString("es-CL")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gasto Variable</p>
                <p className="text-lg font-semibold">
                  {currencySymbol}
                  {(proof.variable_amount || 0).toLocaleString("es-CL")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Multas</p>
                <p className="text-lg font-semibold text-red-600">
                  {currencySymbol}
                  {(proof.fines_amount || 0).toLocaleString("es-CL")}
                </p>
              </div>
            </div>
          </div>

          {/* Period */}
          <div className="border-t pt-6">
            <p className="text-sm text-muted-foreground">Período</p>
            <p className="text-lg font-semibold">
              {proof.period_month}/{proof.period_year}
            </p>
          </div>

          {/* Status */}
          <div className="border-t pt-6">
            <p className="text-sm text-muted-foreground">Estado</p>
            <p className="text-lg font-semibold capitalize">
              {proof.status === "pending"
                ? "Pendiente de Revisión"
                : proof.status === "approved"
                  ? "Aprobado"
                  : "Rechazado"}
            </p>
            {proof.rejection_reason && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>Motivo del rechazo:</strong> {proof.rejection_reason}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {proof.status === "pending" && (
            <div className="border-t pt-6">
              <ProofApprovalDialog
                proof={proof}
                house={house}
                fixedAmount={fixedAmount}
                variableAmount={variableAmount}
                finesAmount={proof.fines_amount || 0}
                currencySymbol={currencySymbol}
                infractions={infractions || []}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
