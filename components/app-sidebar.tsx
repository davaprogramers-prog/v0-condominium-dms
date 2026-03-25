"use client"

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
} from "@/components/ui/sidebar"
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
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "@/app/auth/actions"
import type { User } from "@supabase/supabase-js"

const adminMenuItems = [
  { 
    section: "Dashboard",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
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
    section: "Finanzas",
    items: [
      { title: "Gastos", href: "/dashboard/gastos", icon: Receipt },
      { title: "Tipos de Gastos", href: "/dashboard/tipos-gastos", icon: Tag },
      { title: "Ingresos", href: "/dashboard/ingresos", icon: DollarSign },
      { title: "Ingreso Variable", href: "/dashboard/ingreso-variable", icon: TrendingUp },
      { title: "Cartolas", href: "/dashboard/cartolas", icon: Landmark },
      { title: "Reportes", href: "/dashboard/reportes", icon: BarChart3 },
    ]
  },
  {
    section: "Regulaciones",
    items: [
      { title: "Infracciones", href: "/dashboard/infracciones", icon: AlertTriangle },
      { title: "Exoneraciones", href: "/dashboard/exoneraciones", icon: ShieldOff },
      { title: "Arriendos", href: "/dashboard/arriendos", icon: Key },
    ]
  },
  {
    section: "Participación",
    items: [
      { title: "Encuestas", href: "/dashboard/encuestas", icon: Vote },
      { title: "Proyectos", href: "/dashboard/proyectos", icon: Hammer },
      { title: "Documentos", href: "/dashboard/documentos", icon: FileText },
    ]
  },
  {
    section: "Sistema",
    items: [
      { title: "Configuración", href: "/dashboard/configuracion", icon: Settings },
    ]
  }
]

const ownerMenuItems = [
  {
    section: "Mi Condominio",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Mi Casa", href: "/dashboard/mi-casa", icon: Home },
      { title: "Mis Pagos", href: "/dashboard/ingresos", icon: DollarSign },
      { title: "Encuestas", href: "/dashboard/encuestas", icon: Vote },
      { title: "Proyectos", href: "/dashboard/proyectos", icon: Hammer },
      { title: "Documentos", href: "/dashboard/documentos", icon: FileText },
    ]
  }
]

interface AppSidebarProps {
  user: User
  profile: Record<string, unknown> | null
  condo: Record<string, unknown> | null
}

export function AppSidebar({ user, profile, condo }: AppSidebarProps) {
  const pathname = usePathname()
  const isAdmin = profile?.role === "admin"
  const hasCondo = !!profile?.condo_id

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
    : isAdmin ? adminMenuItems : ownerMenuItems

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">CondoAdmin</span>
            <span className="text-xs text-muted-foreground">
              {condo ? String(condo.name) : "Sin condominio"}
            </span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        {menuSections.map((section) => (
          <SidebarGroup key={section.section}>
            <SidebarGroupLabel>{section.section}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const IconComponent = item.icon
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.href}
                      >
                        <Link href={item.href}>
                          <IconComponent className="h-4 w-4" />
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
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {(profile?.first_name as string)?.[0] || user.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium">
                {profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}` : user.email}
              </span>
              <span className="text-xs text-muted-foreground">{isAdmin ? "Administrador" : "Propietario"}</span>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
