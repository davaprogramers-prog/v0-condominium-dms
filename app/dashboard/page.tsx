import { createClient } from "@/lib/supabase/server"
import { Home, Users, DollarSign, FileText, Settings, LayoutGrid, ChevronRight, BarChart3, FileCheck, AlertCircle, TrendingDown, Newspaper, AlertTriangle, Trees, Plus, Building2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { OwnerHouseCard } from "./owner-house-card"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get profile to check role - with proper error handling
  let profile: any = null
  try {
    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("role, condo_id, first_name, house_id")
      .eq("id", user.id)
      .single()

    if (profileData && !error) {
      profile = profileData
    }
  } catch (e) {
    console.log("[v0] No profile found for user")
  }

  // Determine role
  const role = profile?.role || "propietario"
  const condoId = profile?.condo_id
  const houseId = profile?.house_id

  // If admin/super_admin without condo_id, show admin setup message
  if ((role === "admin" || role === "super_admin") && !condoId) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-6">
          <h1 className="text-3xl font-bold mb-2">Bienvenido, {profile?.first_name || "Administrador"}</h1>
          <p className="text-muted-foreground mb-4">{role === "super_admin" ? "Super Administrador" : "Administrador"}</p>
          <p className="text-muted-foreground">Tu cuenta está siendo configurada. Por favor, espera a que se asigne un condominio.</p>
        </div>
      </div>
    )
  }

  // For other roles, fetch condo data
  let condo = null
  if (condoId) {
    try {
      const { data: condoData, error } = await supabase
        .from("condominiums")
        .select("name")
        .eq("id", condoId)
        .single()
      
      if (condoData && !error) {
        condo = condoData
      }
    } catch (e) {
      console.log("[v0] Error fetching condo")
    }
  }

  // If propietario/owner without condo_id, show message
  if ((role === "propietario" || role === "owner") && !condoId) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-6">
          <h1 className="text-3xl font-bold mb-2">Bienvenido, {profile?.first_name || "Propietario"}</h1>
          <p className="text-muted-foreground mb-4">Propietario</p>
          <p className="text-muted-foreground">Tu cuenta está siendo configurada. Por favor, espera a que se asigne un condominio.</p>
        </div>
      </div>
    )
  }

  // For propietarios with condo_id, get their houses
  let ownerHouses: any[] = []
  if ((role === "propietario" || role === "owner") && condoId) {
    try {
      const { data: houses, error } = await supabase
        .from("houses")
        .select("*")
        .eq("condo_id", condoId)
        .eq("owner_id", user.id)
      
      if (houses && !error) {
        ownerHouses = houses
      }
    } catch (e) {
      console.log("[v0] Error fetching owner houses")
    }
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
    { href: "/dashboard/balance", icon: DollarSign, label: "Balance", desc: "Ver tu saldo" },
    { href: "/dashboard/reportes", icon: BarChart3, label: "Reportes", desc: "Ver reportes" },
    { href: "/dashboard/gastos", icon: TrendingDown, label: "Gastos", desc: "Detalle de gastos" },
    { href: "/dashboard/alertas", icon: AlertTriangle, label: "Alertas", desc: "Notificaciones" },
  ]

  const isAdmin = role === "admin" || role === "super_admin"
  const isOwner = role === "propietario" || role === "owner"

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
