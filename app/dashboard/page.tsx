import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardContent } from "@/components/dashboard-content"
import Link from "next/link"
import { Building2, Settings, Home, Receipt } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Admin sin condominio: mostrar wizard de configuracion
  if (!profile?.condo_id) {
    const isAdmin = profile?.role === "admin"
    return <SetupPrompt isAdmin={isAdmin} />
  }

  const condoId = profile.condo_id

  const [
    { data: expenses },
    { data: payments },
    { data: houses },
    { data: surveys },
    { data: infractions },
    { data: condo },
    { data: variable_income },
    { data: exemptions },
    { data: projects },
  ] = await Promise.all([
    supabase.from("expenses").select("*").eq("condo_id", condoId).order("expense_date", { ascending: false }).limit(10),
    supabase.from("payments").select("*, houses(house_number)").eq("condo_id", condoId).order("created_at", { ascending: false }).limit(15),
    supabase.from("houses").select("*").eq("condo_id", condoId),
    supabase.from("surveys").select("*").eq("condo_id", condoId).eq("is_active", true),
    supabase.from("infractions").select("*").eq("condo_id", condoId).eq("is_paid", false),
    supabase.from("condominiums").select("*").eq("id", condoId).single(),
    supabase.from("variable_income").select("*").eq("condo_id", condoId).order("date", { ascending: false }).limit(10),
    supabase.from("exemptions").select("*").eq("condo_id", condoId),
    supabase.from("projects").select("*").eq("condo_id", condoId),
  ])

  // Calcular estadísticas
  const totalExpenses = expenses?.reduce((acc, e) => acc + Number(e.amount || 0), 0) || 0
  const totalPayments = payments?.filter(p => p.status === "verificado").reduce((acc, p) => acc + Number(p.amount || 0), 0) || 0
  const totalVariableIncome = variable_income?.reduce((acc, v) => acc + Number(v.amount || 0), 0) || 0
  const pendingPayments = payments?.filter(p => p.status === "pendiente").length || 0
  const approvedPayments = payments?.filter(p => p.status === "verificado").length || 0
  const pendingProjects = projects?.filter(p => p.status === "pendiente").length || 0
  const completedProjects = projects?.filter(p => p.status === "completado").length || 0

  return (
    <DashboardContent
      expenses={expenses || []}
      payments={payments || []}
      houses={houses || []}
      activeSurveys={surveys?.length || 0}
      pendingInfractions={infractions?.length || 0}
      variableIncome={variable_income || []}
      condo={condo}
      totalExpenses={totalExpenses}
      totalPayments={totalPayments}
      totalVariableIncome={totalVariableIncome}
      pendingPayments={pendingPayments}
      approvedPayments={approvedPayments}
      projects={projects || []}
      pendingProjects={pendingProjects}
      completedProjects={completedProjects}
      profile={profile}
    />
  )
}

function SetupPrompt({ isAdmin }: { isAdmin: boolean }) {
  if (isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <Building2 className="h-10 w-10 text-primary" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-balance">Bienvenido a CondoAdmin</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Como administrador, primero debes crear tu condominio para empezar a gestionar casas, gastos, ingresos y mucho más.
          </p>
        </div>

        <Link
          href="/dashboard/configuracion"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Settings className="h-4 w-4" />
          Crear mi Condominio
        </Link>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-2xl w-full">
          <StepCard
            step={1}
            icon={<Building2 className="h-5 w-5" />}
            title="Crear Condominio"
            description="Define nombre, moneda y monto de gasto común"
          />
          <StepCard
            step={2}
            icon={<Home className="h-5 w-5" />}
            title="Registrar Casas"
            description="Agrega las casas con número y datos de propietarios"
          />
          <StepCard
            step={3}
            icon={<Receipt className="h-5 w-5" />}
            title="Gestionar"
            description="Registra gastos, ingresos, encuestas y más"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
        <Building2 className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-balance">Bienvenido a CondoAdmin</h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Tu cuenta aún no está asociada a ningún condominio. Contacta a tu administrador para que te vincule a una casa.
        </p>
      </div>
    </div>
  )
}

function StepCard({ step, icon, title, description }: { step: number; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {step}
      </div>
      <div className="text-primary">{icon}</div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
