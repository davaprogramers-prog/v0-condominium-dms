import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserCondoId, getUserHouseId } from "@/lib/supabase/owner-utils"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MisDeudasClient } from "./mis-deudas-client"

interface DebtDetailPageProps {
  params: Promise<{ houseId: string }>
}

export default async function DebtDetailPage({ params }: DebtDetailPageProps) {
  const { houseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const condoId = await getUserCondoId(supabase, user.id)
  if (!condoId) redirect("/dashboard")

  // Verify user has access to this house (owner or admin)
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, house_id")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"
  const isOwner = profile?.house_id === houseId

  // Check if user is owner/admin or resident
  const { data: houseResident } = await supabase
    .from("house_residents")
    .select("*")
    .eq("house_id", houseId)
    .eq("resident_id", user.id)
    .single()

  if (!isAdmin && !isOwner && !houseResident) {
    redirect("/dashboard/mis-deudas")
  }

  // Get house details
  const { data: house } = await supabase
    .from("houses")
    .select("id, house_number, owner_name")
    .eq("id", houseId)
    .eq("condo_id", condoId)
    .single()

  if (!house) {
    redirect("/dashboard/mis-deudas")
  }

  // Get condo info
  const { data: condo } = await supabase
    .from("condominiums")
    .select("currency_symbol")
    .eq("id", condoId)
    .single()

  const currencySymbol = condo?.currency_symbol || "$"

  // Get common expenses
  const { data: commonExpensesData } = await supabase
    .from("condo_expenses")
    .select("*")
    .eq("condo_id", condoId)
    .eq("house_id", houseId)
    .eq("is_paid", false)
  const commonExpenses = commonExpensesData || []

  // Get variable expenses
  const { data: variableExpensesData } = await supabase
    .from("condo_income")
    .select("*")
    .eq("condo_id", condoId)
    .eq("house_id", houseId)
    .neq("income_type", "multa")
    .neq("status", "approved")
  const variableExpenses = variableExpensesData || []

  // Get infractions/fines
  const { data: infractionsData } = await supabase
    .from("infractions")
    .select("*")
    .eq("condo_id", condoId)
    .eq("house_id", houseId)
    .gt("amount_pending", 0)
  const infractions = infractionsData || []

  // Get payment proofs
  const { data: paymentProofsData } = await supabase
    .from("payment_proofs")
    .select("*")
    .eq("house_id", houseId)
    .order("created_at", { ascending: false })
  const paymentProofs = paymentProofsData || []

  // Calculate totals
  const commonExpenseTotal = commonExpenses.reduce((acc, e) => acc + (e.amount || 0), 0)
  const variableExpenseTotal = variableExpenses.reduce((acc, e) => acc + (e.amount || 0), 0)
  const finesTotal = infractions.reduce((acc, i) => acc + (i.amount_pending || 0), 0)

  const totalDebt = commonExpenseTotal + variableExpenseTotal + finesTotal

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/mis-deudas">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Casa #{house.house_number}</h1>
          <p className="text-muted-foreground">{house.owner_name}</p>
        </div>
      </div>

      <MisDeudasClient
        houseId={houseId}
        houseNumber={house.house_number}
        condoId={condoId}
        currencySymbol={currencySymbol}
        commonExpenses={commonExpenses}
        variableExpenses={variableExpenses}
        infractions={infractions}
        commonExpenseTotal={commonExpenseTotal}
        variableExpenseTotal={variableExpenseTotal}
        finesTotal={finesTotal}
        totalDebt={totalDebt}
      />
    </div>
  )
}
