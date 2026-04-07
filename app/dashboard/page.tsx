import { createClient } from "@/lib/supabase/server"
import { Home, Users, DollarSign, FileText, Settings, LayoutGrid, ChevronRight, BarChart3, FileCheck, AlertCircle, TrendingDown, Newspaper, AlertTriangle, Trees, Plus, Building2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { OwnerHouseCard } from "./owner-house-card"
import { SuperAdminDashboard } from "./super-admin-dashboard"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get profile to check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, condo_id, first_name, house_id")
    .eq("id", user?.id)
    .single()

  // If super_admin, show dedicated dashboard
  if (profile?.role === "super_admin") {
    return <SuperAdminDashboard user={user} />
  }

  // If admin without condo_id, show admin setup message
  if (profile?.role === "admin" && !profile?.condo_id) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-6">
          <h1 className="text-3xl font-bold mb-2">Bienvenido, {profile?.first_name}</h1>
          <p className="text-muted-foreground mb-4">Administrador</p>
          <p className="text-muted-foreground">Tu cuenta está siendo configurada. Por favor, espera a que se asigne un condominio.</p>
        </div>
      </div>
    )
  }

  // For other roles, fetch condo data
  let condo = null
  if (profile?.condo_id) {
    const { data } = await supabase
      .from("condominiums")
      .select("name")
      .eq("id", profile.condo_id)
      .single()
    condo = data
  }

  // If propietario without condo_id, show message
  if (profile?.role === "propietario" && !profile?.condo_id) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-6">
          <h1 className="text-3xl font-bold mb-2">Bienvenido, {profile?.first_name}</h1>
          <p className="text-muted-foreground mb-4">Propietario</p>
          <p className="text-muted-foreground">Tu cuenta está siendo configurada. Por favor, espera a que se asigne un condominio.</p>
        </div>
      </div>
    )
  }

  // For propietarios with condo_id, get their houses
  let ownerHouses: any[] = []
  if (profile?.role === "propietario" && profile?.condo_id) {
    const { data: houses } = await supabase
      .from("houses")
      .select("*")
      .eq("condo_id", profile.condo_id)
      .in("id", [profile.house_id])

    ownerHouses = houses || []
  }

  const adminMenuItems = [
    { href: "/dashboard/casas", icon: Home, label: "Casas", desc: "Gestión de propiedades" },
    { href: "/dashboard/usuarios", icon: Users, label: "Usuarios", desc: "Administrar residentes" },
    { href: "/dashboard/gastos", icon: DollarSign, label: "Gastos", desc: "Registrar gastos comunes" },
    { href: "/dashboard/ingresos", icon: DollarSign, label: "Ingresos", desc: "Registrar pagos recibidos" },
    { href: "/dashboard/propietarios", icon: Users, label: "Propietarios", desc: "Ver todos los propietarios" },
    { href: "/dashboard/reportes", icon: BarChart3, label: "Reportes", desc: "Ver reportes y estadísticas" },
    { href: "/dashboard/documentos", icon: FileText, label: "Documentos", desc: "Documentación importante" },
    { href: "/dashboard/encuestas", icon: FileCheck, label: "Encuestas", desc: "Gestionar encuestas" },
  ]

  const ownerMenuItems = [
    { href: "/dashboard/mi-casa/balance", icon: DollarSign, label: "Balance", desc: "Ver tu saldo" },
    { href: "/dashboard/mi-casa/encuestas", icon: Newspaper, label: "Encuestas", desc: "Participar en encuestas" },
    { href: "/dashboard/mi-casa/proyectos", icon: LayoutGrid, label: "Proyectos", desc: "Proyectos activos" },
    { href: "/dashboard/mi-casa/documentos", icon: FileText, label: "Documentos", desc: "Tus documentos" },
    { href: "/dashboard/mi-casa/infracciones", icon: AlertCircle, label: "Infracciones", desc: "Historial de infracciones" },
    { href: "/dashboard/mi-casa/cartolas", icon: FileCheck, label: "Cartolas", desc: "Tus cartolas" },
    { href: "/dashboard/mi-casa/reportes", icon: BarChart3, label: "Reportes", desc: "Ver reportes" },
    { href: "/dashboard/mi-casa/gastos", icon: TrendingDown, label: "Gastos", desc: "Detalle de gastos" },
    { href: "/dashboard/mi-casa/areas-comunes", icon: Trees, label: "Áreas Comunes", desc: "Información de áreas" },
  ]

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"
  const isOwner = profile?.role === "propietario"

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Bienvenido, {profile?.first_name}</h1>
            <p className="text-muted-foreground">{condo?.name || "Condominio"}</p>
          </div>
          <Link href="/dashboard/configuracion" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-fit">
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </Button>
          </Link>
        </div>
      </div>

      {/* Admin Dashboard */}
      {isAdmin && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {adminMenuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="flex flex-col gap-3 rounded-lg border bg-card p-6 hover:bg-accent transition-colors cursor-pointer h-full">
                <item.icon className="h-8 w-8 text-primary" />
                <div>
                  <h2 className="font-semibold">{item.label}</h2>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Owner Dashboard */}
      {isOwner && (
        <div className="space-y-6">
          {/* House Cards */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Mis Propiedades</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ownerHouses.map((house) => (
                <OwnerHouseCard key={house.id} house={house} condoName={condo?.name || "Condominio"} />
              ))}
            </div>
          </div>

          {/* Quick Access Menu */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Acceso Rápido</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {ownerMenuItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div className="flex flex-col gap-2 rounded-lg border bg-card p-4 hover:bg-accent transition-colors cursor-pointer h-full text-center">
                    <item.icon className="h-6 w-6 text-primary mx-auto" />
                    <div>
                      <h3 className="text-sm font-medium leading-tight">{item.label}</h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
