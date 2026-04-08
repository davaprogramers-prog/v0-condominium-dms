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

const ownerMenuItems = [
  {
    section: "Dashboard",
    items: [
      { title: "Reportes", href: "/dashboard/mi-casa/reportes", icon: BarChart3 },
      { title: "Balance", href: "/dashboard/mi-casa/balance", icon: Landmark },
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
      { title: "Áreas Comunes", href: "/dashboard/mi-casa/areas-comunes", icon: MapPin },
      { title: "Mis Visitas", href: "/dashboard/visitas", icon: Calendar },
      { title: "Cartolas", href: "/dashboard/mi-casa/cartolas", icon: Landmark },
      { title: "Encuestas", href: "/dashboard/mi-casa/encuestas", icon: Vote },
      { title: "Proyectos", href: "/dashboard/mi-casa/proyectos", icon: Hammer },
      { title: "Documentos", href: "/dashboard/mi-casa/documentos", icon: FileText },
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
          <span className="text-sm font-semibold truncate max-w-[140px]">
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
                        <Link href={item.href} onClick={handleNavClick}>
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

        {/* Super Admin Section */}
        {isSuperAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Super Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === "/admin"}
                  >
                    <Link href="/admin" onClick={handleNavClick}>
                      <Key className="h-4 w-4" />
                      <span>Panel de Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {hasCondo && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      isActive={pathname === "/dashboard/administradores"}
                    >
                      <Link href="/dashboard/administradores" onClick={handleNavClick}>
                        <Users className="h-4 w-4" />
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

      <SidebarFooter className="border-t p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url as string} 
                alt="Avatar" 
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {(profile?.first_name as string)?.[0] || user.email?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-xs font-medium">
                {profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}` : user.email}
              </span>
              <span className="text-xs text-muted-foreground">
                {isSuperAdmin ? "Super Admin" : isAdmin ? "Administrador" : "Propietario"}
              </span>
            </div>
          </div>
          <Link
            href="/dashboard/mi-cuenta"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            Mi Cuenta
          </Link>
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
