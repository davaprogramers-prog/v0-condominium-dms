import { createClient } from "@/lib/supabase/server"
import { Home, Users, DollarSign, FileText, Settings, LayoutGrid, ChevronRight, BarChart3, FileCheck, AlertCircle, TrendingDown, Newspaper, AlertTriangle, Trees, Plus, Building2, Package } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { OwnerHouseCard } from "./owner-house-card"

const colorMap: Record<string, { bg: string; }> = {
  "bg-blue-500": { bg: "#3B82F6" },
  "bg-purple-500": { bg: "#A855F7" },
  "bg-orange-500": { bg: "#F97316" },
  "bg-green-500": { bg: "#22C55E" },
  "bg-pink-500": { bg: "#EC4899" },
  "bg-cyan-500": { bg: "#06B6D4" },
  "bg-amber-500": { bg: "#F59E0B" },
  "bg-indigo-500": { bg: "#6366F1" },
  "bg-emerald-500": { bg: "#10B981" },
  "bg-red-500": { bg: "#EF4444" },
  "bg-blue-600": { bg: "#2563EB" },
}

const getColorStyle = (colorKey: string) => colorMap[colorKey] || { bg: "rgb(59, 130, 246)" }

const adminMenuItems = [
  { href: "/dashboard/casas", icon: Home, label: "Casas", desc: "Gestión de propiedades", colorKey: "bg-blue-500" },
  { href: "/dashboard/usuarios", icon: Users, label: "Usuarios", desc: "Administrar residentes", colorKey: "bg-purple-500" },
  { href: "/dashboard/gastos", icon: DollarSign, label: "Gastos", desc: "Registrar gastos comunes", colorKey: "bg-orange-500" },
  { href: "/dashboard/ingresos", icon: DollarSign, label: "Ingresos", desc: "Registrar pagos recibidos", colorKey: "bg-green-500" },
  { href: "/dashboard/propietarios", icon: Users, label: "Residentes", desc: "Ver todos los residentes", colorKey: "bg-pink-500" },
  { href: "/dashboard/reportes", icon: BarChart3, label: "Reportes", desc: "Ver reportes y estadísticas", colorKey: "bg-cyan-500" },
  { href: "/dashboard/documentos", icon: FileText, label: "Documentos", desc: "Documentación importante", colorKey: "bg-amber-500" },
  { href: "/dashboard/encuestas", icon: FileCheck, label: "Encuestas", desc: "Gestionar encuestas", colorKey: "bg-indigo-500" },
]

const ownerMenuItems = [
  { href: "/dashboard/balance", icon: DollarSign, label: "Balance", desc: "Ver tu saldo", colorKey: "bg-emerald-500" },
  { href: "/dashboard/reportes", icon: BarChart3, label: "Reportes", desc: "Ver reportes", colorKey: "bg-cyan-500" },
  { href: "/dashboard/gastos", icon: TrendingDown, label: "Gastos", desc: "Detalle de gastos", colorKey: "bg-orange-500" },
  { href: "/dashboard/alertas", icon: AlertTriangle, label: "Alertas", desc: "Notificaciones", colorKey: "bg-red-500" },
  { href: "/dashboard/areas-comunes", icon: Home, label: "Instalaciones", desc: "Reservar espacios", colorKey: "bg-purple-500" },
  { href: "/dashboard/encomiendas", icon: Package, label: "Encomiendas", desc: "Recibir paquetes", colorKey: "bg-blue-600" },
]

export default async function DashboardPage() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return (
        <div className="space-y-6">
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
            <h1 className="text-xl font-bold text-destructive mb-2">Error de Autenticación</h1>
            <p className="text-muted-foreground">No se pudo verificar tu sesión. Por favor, inicia sesión nuevamente.</p>
          </div>
        </div>
      )
    }

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
      // Profile fetch failed, will use fallback
    }

    // If no profile, create fallback from metadata (same as layout)
    if (!profile) {
      profile = {
        role: user.user_metadata?.role || "propietario",
        condo_id: user.user_metadata?.condo_id || null,
        house_id: user.user_metadata?.house_id || null,
        first_name: user.user_metadata?.first_name || user.user_metadata?.name || user.email?.split("@")[0] || "Usuario",
        last_name: user.user_metadata?.last_name || "",
      }
    }

    // Determine role - default to propietario if not found
    const role = profile?.role || "propietario"
    let condoId = profile?.condo_id
    let firstName = profile?.first_name || "Usuario"

    // If owner without condo_id, try to get it from house_owners table (same as layout)
    const isOwner = role === "propietario" || role === "owner"
    if (isOwner && !condoId) {
      console.log("[v0] Owner without condo_id in dashboard page, searching via utility function")
      const { getUserCondoId } = await import("@/lib/supabase/owner-utils")
      const foundCondoId = await getUserCondoId(supabase, user.id, user.email)
      if (foundCondoId) {
        condoId = foundCondoId
        console.log("[v0] Found condo_id via utility in dashboard page:", foundCondoId)
      }
    }

    // If regular admin without condo_id, show admin setup message
    // Super admin can access everything without needing a condo_id
    if (role === "admin" && !condoId) {
      return (
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h1 className="text-3xl font-bold mb-2">Bienvenido, {firstName}</h1>
            <p className="text-muted-foreground mb-4">Administrador</p>
            <p className="text-muted-foreground">Tu cuenta está siendo configurada. Por favor, espera a que se asigne un condominio.</p>
          </div>
        </div>
      )
    }

    // Super admin without condo_id still gets full admin dashboard
    const isSuperAdmin = role === "super_admin"

    // Fetch condo info (only if user has a condo assigned)
    let condo: any = null
    if (condoId) {
      try {
        const { data: condoData } = await supabase
          .from("condominiums")
          .select("name")
          .eq("id", condoId)
          .single()
        
        if (condoData) {
          condo = condoData
        }
      } catch (e) {
        console.log("[v0] Error fetching condo:", e)
      }
    }

    // If propietario/owner without condo_id, show message
    if ((role === "propietario" || role === "owner") && !condoId) {
      return (
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h1 className="text-3xl font-bold mb-2">Bienvenido, {firstName}</h1>
            <p className="text-muted-foreground mb-4">Residente</p>
            <p className="text-muted-foreground">Tu cuenta está siendo configurada. Por favor, espera a que se asigne un condominio.</p>
          </div>
        </div>
      )
    }

    // For propietarios with condo_id, get their houses
    let ownerHouses: any[] = []
    if ((role === "propietario" || role === "owner") && condoId) {
      try {
        const { data: houses } = await supabase
          .from("houses")
          .select("*")
          .eq("condo_id", condoId)
          .eq("owner_user_id", user.id)
        
        if (houses) {
          ownerHouses = houses
        }
      } catch (e) {
        console.log("[v0] Error fetching owner houses:", e)
      }
    }

    const isAdmin = role === "admin" || role === "super_admin"

    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold">Bienvenido, {firstName}</h1>
              <p className="text-muted-foreground">
                {isSuperAdmin ? "Super Administrador - Todos los condominios" : condo?.name || "Condominio"}
              </p>
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
                <div className="flex flex-col gap-3 rounded-lg border bg-card p-6 hover:bg-accent transition-colors cursor-pointer h-full hover:shadow-md hover:border-primary/50">
                  <div 
                    className="h-10 w-10 rounded-lg flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: getColorStyle(item.colorKey).bg }}
                  >
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
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
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {ownerMenuItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div className="flex flex-col gap-2 rounded-lg border bg-card p-4 hover:bg-accent transition-colors cursor-pointer h-full text-center group hover:shadow-md hover:border-primary/50">
                      <div 
                        className="h-10 w-10 mx-auto rounded-lg flex items-center justify-center shadow-lg transition"
                        style={{ backgroundColor: getColorStyle(item.colorKey).bg }}
                      >
                        <item.icon className="h-6 w-6 text-white" />
                      </div>
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
  } catch (error) {
    console.error("[v0] Dashboard error:", error)
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
          <h1 className="text-xl font-bold text-destructive mb-2">Error</h1>
          <p className="text-muted-foreground">Ocurrió un error al cargar el dashboard. Por favor, intenta nuevamente más tarde.</p>
        </div>
      </div>
    )
  }
}
