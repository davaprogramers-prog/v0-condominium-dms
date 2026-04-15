"use client"

import { useState } from "react"
import { useTheme } from "@/app/dashboard/theme-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Building2,
  LayoutDashboard,
  Receipt,
  Tag,
  BarChart3,
  Home,
  DollarSign,
  TrendingUp,
  ShieldOff,
  Hammer,
  Vote,
  FileText,
  AlertTriangle,
  Key,
  MapPin,
  Landmark,
  Settings,
  LogOut,
  Users,
  ChevronDown,
  Calendar,
  Package,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "@/app/auth/actions"
import { switchCondo } from "@/app/dashboard/actions"
import type { User } from "@supabase/supabase-js"

const iconColorMap: Record<string, string> = {
  "dashboard": "#60A5FA",      // Azul brillante
  "usuarios": "#D946EF",       // Púrpura vibrante  
  "gastos": "#FF8C42",         // Naranja fuerte
  "ingresos": "#34D399",       // Verde brillante
  "propietarios": "#F472B6",   // Rosa vibrante
  "reportes": "#22D3EE",       // Cyan brillante
  "documentos": "#FBBF24",     // Ámbar brillante
  "encuestas": "#818CF8",      // Índigo brillante
  "balance": "#1ECB7F",        // Esmeralda vibrante
  "alertas": "#F87171",        // Rojo brillante
  "areas-comunes": "#D946EF",  // Púrpura vibrante
  "mi-casa": "#60A5FA",        // Azul brillante
  "cartolas": "#22D3EE",       // Cyan brillante
  "proyectos": "#FBBF24",      // Ámbar brillante
  "configuracion": "#A78BFA",  // Púrpura claro
  "visitas": "#F472B6",        // Rosa vibrante
  "encomiendas": "#3B82F6",    // Azul para paquetes
}

const adminMenuItems = [
  { 
    section: "Dashboard",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Reportes", href: "/dashboard/reportes", icon: BarChart3 },
      { title: "Balance", href: "/dashboard/balance", icon: Landmark },
    ]
  },
  {
    section: "Mi Propiedad",
    items: [
      { title: "Mi Casa", href: "/dashboard/mi-casa", icon: Home },
    ]
  },
  {
    section: "Gestión",
    items: [
      { title: "Casas", href: "/dashboard/casas", icon: Home },
      { title: "Usuarios", href: "/dashboard/usuarios", icon: Users },
      { title: "Áreas Comunes", href: "/dashboard/areas-comunes", icon: MapPin },
    ]
  },
  {
    section: "Configuraciones",
    items: [
      { title: "Tipos de Gastos", href: "/dashboard/tipos-gastos", icon: Tag },
      { title: "Tipos de Exoneraciones", href: "/dashboard/tipos-exoneraciones", icon: ShieldOff },
    ]
  },
  {
    section: "Finanzas",
    items: [
      { title: "Propietarios", href: "/dashboard/propietarios", icon: Users },
      { title: "Gastos", href: "/dashboard/gastos", icon: Receipt },
      { title: "Ingresos", href: "/dashboard/ingresos", icon: DollarSign },
      { title: "Ingresos Variables", href: "/dashboard/ingreso-variable", icon: TrendingUp },
      { title: "Ingresos por Multas", href: "/dashboard/ingresos-multas", icon: AlertTriangle },
      { title: "Cartolas", href: "/dashboard/cartolas", icon: Landmark },
    ]
  },
  {
    section: "Regulaciones",
    items: [
      { title: "Infracciones", href: "/dashboard/infracciones", icon: AlertTriangle },
      { title: "Exoneraciones", href: "/dashboard/exoneraciones", icon: ShieldOff },
    ]
  },
  {
    section: "Administración",
    items: [
      { title: "Conserjes", href: "/dashboard/conserjes", icon: Users },
      { title: "Visitas", href: "/dashboard/visitas-admin", icon: Calendar },
      { title: "Encomiendas", href: "/dashboard/encomiendas", icon: Package },
      { title: "Solicitudes de Materiales", href: "/dashboard/solicitudes-materiales", icon: Receipt },
      { title: "Encuestas", href: "/dashboard/encuestas", icon: Vote },
      { title: "Proyectos", href: "/dashboard/proyectos", icon: Hammer },
      { title: "Documentos", href: "/dashboard/documentos", icon: FileText },
    ]
  },
  {
    section: "Sistema",
    items: [
      { title: "Configuración", href: "/dashboard/configuracion", icon: Settings },
      { title: "Alertas", href: "/dashboard/alertas", icon: AlertTriangle },
    ]
  }
]

const adminWithPropertyMenuItems = [
  { 
    section: "Dashboard",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Reportes", href: "/dashboard/reportes", icon: BarChart3 },
      { title: "Balance", href: "/dashboard/balance", icon: Landmark },
    ]
  },
  {
    section: "Mi Propiedad",
    items: [
      { title: "Mi Casa", href: "/dashboard/mi-casa", icon: Home },
      { title: "Mis Visitas", href: "/dashboard/visitas", icon: Calendar },
      { title: "Encomiendas", href: "/dashboard/encomiendas", icon: Package },
    ]
  },
  {
    section: "Gestión",
    items: [
      { title: "Usuarios", href: "/dashboard/usuarios", icon: Users },
      { title: "Áreas Comunes", href: "/dashboard/areas-comunes", icon: MapPin },
    ]
  },
  {
    section: "Configuraciones",
    items: [
      { title: "Tipos de Gastos", href: "/dashboard/tipos-gastos", icon: Tag },
      { title: "Tipos de Exoneraciones", href: "/dashboard/tipos-exoneraciones", icon: ShieldOff },
    ]
  },
  {
    section: "Finanzas",
    items: [
      { title: "Propietarios", href: "/dashboard/propietarios", icon: Users },
      { title: "Gastos", href: "/dashboard/gastos", icon: Receipt },
      { title: "Ingresos", href: "/dashboard/ingresos", icon: DollarSign },
      { title: "Ingresos Variables", href: "/dashboard/ingreso-variable", icon: TrendingUp },
      { title: "Ingresos por Multas", href: "/dashboard/ingresos-multas", icon: AlertTriangle },
      { title: "Cartolas", href: "/dashboard/cartolas", icon: Landmark },
    ]
  },
  {
    section: "Regulaciones",
    items: [
      { title: "Infracciones", href: "/dashboard/infracciones", icon: AlertTriangle },
      { title: "Exoneraciones", href: "/dashboard/exoneraciones", icon: ShieldOff },
    ]
  },
  {
    section: "Administración",
    items: [
      { title: "Conserjes", href: "/dashboard/conserjes", icon: Users },
      { title: "Visitas", href: "/dashboard/visitas-admin", icon: Calendar },
      { title: "Encomiendas", href: "/dashboard/encomiendas", icon: Package },
      { title: "Solicitudes de Materiales", href: "/dashboard/solicitudes-materiales", icon: Receipt },
      { title: "Encuestas", href: "/dashboard/encuestas", icon: Vote },
      { title: "Proyectos", href: "/dashboard/proyectos", icon: Hammer },
      { title: "Documentos", href: "/dashboard/documentos", icon: FileText },
    ]
  },
  {
    section: "Sistema",
    items: [
      { title: "Configuración", href: "/dashboard/configuracion", icon: Settings },
      { title: "Alertas", href: "/dashboard/alertas", icon: AlertTriangle },
    ]
  }
]

const ownerMenuItems = [
  {
    section: "Dashboard",
    items: [
      { title: "Reportes", href: "/dashboard/reportes", icon: BarChart3 },
      { title: "Balance", href: "/dashboard/balance", icon: Landmark },
    ]
  },
  {
    section: "Mi Propiedad",
    items: [
      { title: "Mi Casa", href: "/dashboard/mi-casa", icon: Home },
    ]
  },
  {
    section: "Condominio",
    items: [
      { title: "Áreas Comunes", href: "/dashboard/areas-comunes", icon: MapPin },
      { title: "Mis Visitas", href: "/dashboard/visitas", icon: Calendar },
      { title: "Encomiendas", href: "/dashboard/encomiendas", icon: Package },
      { title: "Cartolas", href: "/dashboard/cartolas", icon: Landmark },
      { title: "Encuestas", href: "/dashboard/encuestas", icon: Vote },
      { title: "Proyectos", href: "/dashboard/proyectos", icon: Hammer },
      { title: "Documentos", href: "/dashboard/documentos", icon: FileText },
      { title: "Alertas", href: "/dashboard/alertas", icon: AlertTriangle },
    ]
  }
]

const conciergeMenuItems = [
  {
    section: "Conserje",
    items: [
      { title: "Visitas", href: "/dashboard/visitas", icon: Calendar },
      { title: "Encomiendas", href: "/dashboard/encomiendas", icon: Package },
      { title: "Áreas Comunes", href: "/dashboard/areas-comunes", icon: MapPin },
      { title: "Alertas", href: "/dashboard/alertas", icon: AlertTriangle },
    ]
  }
]

interface AppSidebarProps {
  user: User
  profile: Record<string, unknown> | null
  condo: Record<string, unknown> | null
  allCondos?: { id: string; name: string }[]
  hasMultipleProperties?: boolean
}

export function AppSidebar({ user, profile, condo, allCondos = [], hasMultipleProperties = false }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [switching, setSwitching] = useState(false)
  const { isMobile, setOpenMobile } = useSidebar()
  const { sidebarBgColor, sidebarTextColor, cardBgColor, cardTextColor } = useTheme()
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"
  const isSuperAdmin = profile?.role === "super_admin"
  const isOwner = profile?.role === "propietario" || profile?.role === "owner"
  const isConcierge = profile?.role === "conserje" || profile?.role === "concierge"
  const hasCondo = !!profile?.condo_id
  const hasProperty = !!profile?.house_id
  const canSwitchCondo = allCondos.length > 1
  
  // Determine if clicking the logo should go to select-condominium
  const shouldGoToSelector = isOwner && hasMultipleProperties

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const handleCondoSwitch = async (condoId: string) => {
    if (condoId === profile?.condo_id) return
    setSwitching(true)
    try {
      await switchCondo(condoId)
      router.refresh()
    } finally {
      setSwitching(false)
    }
  }

  // Super admin always sees full admin menu, regardless of condo assignment
  // Regular admin without condo sees limited menu
  // Admin with property sees admin menu + Mi Casa
  const menuSections = isSuperAdmin
    ? adminMenuItems
    : !hasCondo && isAdmin
    ? [
        {
          section: "Configuración",
          items: [
            { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { title: "Configuración", href: "/dashboard/configuracion", icon: Settings },
          ]
        }
      ]
    : isAdmin && hasProperty ? adminWithPropertyMenuItems
    : isAdmin ? adminMenuItems
    : isConcierge ? conciergeMenuItems
    : ownerMenuItems

  return (
    <Sidebar 
      className="!border-r !bg-opacity-100 !backdrop-filter-none !backdrop-blur-none"
      style={{
        '--sidebar-bg': (sidebarBgColor || "#ffffff"),
        '--sidebar-text': (sidebarTextColor || "#000000"),
        backgroundColor: (sidebarBgColor || "#ffffff"),
        borderColor: sidebarTextColor || "#000000",
        backdropFilter: "none !important",
        WebkitBackdropFilter: "none !important",
      } as React.CSSProperties}
    >
      <SidebarHeader 
        className="border-b p-4"
        style={{
          backgroundColor: sidebarBgColor || "#ffffff",
          borderColor: sidebarTextColor || "#000000",
        }}
      >
        <div className="flex items-center gap-2 w-full">
          <button 
            onClick={() => {
              if (shouldGoToSelector) {
                router.push("/select-condominium")
              } else {
                router.push("/dashboard")
              }
              if (isMobile) setOpenMobile(false)
            }}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer flex-1 text-left"
            title={shouldGoToSelector ? "Cambiar condominio o propiedad" : "Ir a dashboard"}
          >
            {condo?.logo_url ? (
              <Image
                src={String(condo.logo_url)}
                alt={String(condo.name || "Logo")}
                width={36}
                height={36}
                className="h-9 w-9 rounded-lg object-contain flex-shrink-0"
              />
            ) : (
              <Image
                src="/logo.png"
                alt="InteliCon"
                width={36}
                height={36}
                className="h-9 w-9 rounded-lg object-contain flex-shrink-0"
              />
            )}
            <span className="text-sm font-semibold truncate" style={{ color: sidebarTextColor || "#000000" }}>
              {condo ? String(condo.name) : "Sin condominio"}
            </span>
          </button>

          {/* Change Property Indicator */}
          {shouldGoToSelector && (
            <button
              onClick={() => {
                router.push("/select-condominium")
                if (isMobile) setOpenMobile(false)
              }}
              className="flex-shrink-0 hover:opacity-90 transition-all hover:scale-110 relative"
            >
              <Image
                src="/swap-property-icon.png"
                alt="Cambiar propiedad"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full peer"
                style={{ transform: "scaleX(-1)" }}
              />
              
              {/* Tooltip - only shows on peer hover */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 peer-hover:opacity-100 transition-opacity pointer-events-none z-50" style={{ transform: "translateX(-50%)" }}>
                Cambiar propiedad
              </div>
            </button>
          )}
        </div>
        
        {/* Condo Selector for admins with multiple condos */}
        {canSwitchCondo && (
          <div className="mt-3">
            <Select 
              value={profile?.condo_id as string || ""} 
              onValueChange={handleCondoSwitch}
              disabled={switching}
            >
              <SelectTrigger className="w-full text-xs h-8">
                <SelectValue placeholder="Seleccionar condominio" />
              </SelectTrigger>
              <SelectContent>
                {allCondos.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent 
        className="!bg-opacity-100 !backdrop-filter-none !backdrop-blur-none"
        style={{ 
          backgroundColor: (sidebarBgColor || "#ffffff") + " !important",
          backdropFilter: "none !important",
          WebkitBackdropFilter: "none !important",
        }}
      >
        {menuSections.map((section) => (
          <SidebarGroup key={section.section}>
            <SidebarGroupLabel style={{ color: cardTextColor, opacity: 0.7 }} className="font-semibold">{section.section}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const IconComponent = item.icon
                  const iconKey = item.href.split("/").pop() || "dashboard"
                  const iconColor = iconColorMap[iconKey] || "#6B7280"
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.href}
                        style={{ color: cardTextColor }}
                        className="hover:opacity-80"
                      >
                        <Link href={item.href} onClick={handleNavClick}>
                          <IconComponent className="h-4 w-4" style={{ color: iconColor }} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Super Admin Section */}
        {isSuperAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel style={{ color: cardTextColor, opacity: 0.7 }} className="font-semibold">Super Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === "/admin"}
                    style={{ color: cardTextColor }}
                    className="hover:opacity-80"
                  >
                    <Link href="/admin" onClick={handleNavClick}>
                      <Key className="h-4 w-4" style={{ color: "#6366F1" }} />
                      <span>Panel de Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {hasCondo && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      isActive={pathname === "/dashboard/administradores"}
                      style={{ color: cardTextColor }}
                      className="hover:opacity-80"
                    >
                      <Link href="/dashboard/administradores" onClick={handleNavClick}>
                        <Users className="h-4 w-4" style={{ color: "#A855F7" }} />
                        <span>Administradores</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter 
        className="border-t p-4"
        style={{ 
          backgroundColor: sidebarBgColor || "#ffffff",
          borderColor: sidebarTextColor || "#000000",
        }}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url as string} 
                alt="Avatar" 
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div 
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: cardBgColor || "#60A5FA",
                  color: cardTextColor || "#FFFFFF"
                }}
              >
                {(profile?.first_name as string)?.[0] || user.email?.[0]?.toUpperCase() || "U"}
              </div>
            )}
          <div className="flex flex-col">
              <span className="text-xs font-medium" style={{ color: sidebarTextColor || "#000000" }}>
                {profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}` : user.email}
              </span>
              <span className="text-xs" style={{ color: sidebarTextColor || "#000000", opacity: 0.7 }}>
                {isSuperAdmin ? "Super Admin" : isAdmin ? "Administrador" : "Propietario"}
              </span>
            </div>
          </div>
          <Link
            href="/dashboard/configuracion"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-blue-500 hover:text-white dark:text-white dark:hover:bg-slate-700 dark:hover:text-white"
            style={{ color: sidebarTextColor || "#000000" }}
          >
            <Settings className="h-4 w-4" style={{ color: "#A78BFA" }} />
            Configuración
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-red-500 hover:text-white dark:text-white dark:hover:bg-slate-700 dark:hover:text-red-400"
              style={{ color: sidebarTextColor || "#000000" }}
            >
              <LogOut className="h-4 w-4" style={{ color: "#F87171" }} />
              Cerrar sesión
            </button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
