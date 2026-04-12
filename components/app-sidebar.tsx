"use client"

import { useState } from "react"
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
    section: "Finanzas",
    items: [
      { title: "Propietarios", href: "/dashboard/propietarios", icon: Users },
      { title: "Gastos", href: "/dashboard/gastos", icon: Receipt },
      { title: "Ingresos", href: "/dashboard/ingresos", icon: DollarSign },
      { title: "Ingresos Variables", href: "/dashboard/ingreso-variable", icon: TrendingUp },
      { title: "Cartolas", href: "/dashboard/cartolas", icon: Landmark },
    ]
  },
  {
    section: "Administración",
    items: [
      { title: "Encuestas", href: "/dashboard/encuestas", icon: Vote },
      { title: "Proyectos", href: "/dashboard/proyectos", icon: Hammer },
      { title: "Documentos", href: "/dashboard/documentos", icon: FileText },
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
      { title: "Cartolas", href: "/dashboard/cartolas", icon: Landmark },
      { title: "Encuestas", href: "/dashboard/encuestas", icon: Vote },
      { title: "Proyectos", href: "/dashboard/proyectos", icon: Hammer },
      { title: "Documentos", href: "/dashboard/documentos", icon: FileText },
      { title: "Alertas", href: "/dashboard/alertas", icon: AlertTriangle },
    ]
  }
]

interface AppSidebarProps {
  user: User
  profile: Record<string, unknown> | null
  condo: Record<string, unknown> | null
  allCondos?: { id: string; name: string }[]
}

export function AppSidebar({ user, profile, condo, allCondos = [] }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [switching, setSwitching] = useState(false)
  const { isMobile, setOpenMobile } = useSidebar()
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"
  const isSuperAdmin = profile?.role === "super_admin"
  const isOwner = profile?.role === "propietario" || profile?.role === "owner"
  const hasCondo = !!profile?.condo_id
  const hasProperty = !!profile?.house_id
  const canSwitchCondo = allCondos.length > 1

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

  // If admin has property assigned, use the menu with "Mi casa", otherwise use regular admin menu
  const menuSections = !hasCondo && isAdmin
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
    : ownerMenuItems

  return (
    <Sidebar className="bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <SidebarHeader className="border-b border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-4">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={handleNavClick}>
          {condo?.logo_url ? (
            <Image
              src={String(condo.logo_url)}
              alt={String(condo.name || "Logo")}
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-contain"
            />
          ) : (
            <Image
              src="/logo.png"
              alt="InteliCon"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-contain"
            />
          )}
          <span className="text-sm font-semibold truncate max-w-[140px] text-white">
            {condo ? String(condo.name) : "Sin condominio"}
          </span>
        </Link>
        
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
      
      <SidebarContent>
        {menuSections.map((section) => (
          <SidebarGroup key={section.section}>
            <SidebarGroupLabel className="text-slate-400 dark:text-slate-100 font-semibold">{section.section}</SidebarGroupLabel>
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
                        className="text-slate-300 dark:text-slate-100 hover:text-white dark:hover:text-white hover:bg-slate-700 dark:hover:bg-slate-700"
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
            <SidebarGroupLabel className="text-slate-400 dark:text-white font-semibold">Super Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === "/admin"}
                    className="text-slate-300 dark:text-white hover:text-white dark:hover:text-white hover:bg-slate-700 dark:hover:bg-slate-700"
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
                      className="text-slate-300 dark:text-white hover:text-white dark:hover:text-white hover:bg-slate-700 dark:hover:bg-slate-700"
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

      <SidebarFooter className="border-t border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url as string} 
                alt="Avatar" 
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white">
                {(profile?.first_name as string)?.[0] || user.email?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-xs font-medium text-white">
                {profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}` : user.email}
              </span>
              <span className="text-xs text-white">
                {isSuperAdmin ? "Super Admin" : isAdmin ? "Administrador" : "Propietario"}
              </span>
            </div>
          </div>
          <Link
            href="/dashboard/mi-cuenta"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white hover:bg-blue-500 hover:text-white dark:text-white dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <Settings className="h-4 w-4" style={{ color: "#A78BFA" }} />
            Mi Cuenta
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white hover:bg-red-500 hover:text-white dark:text-white dark:hover:bg-slate-700 dark:hover:text-red-400"
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
