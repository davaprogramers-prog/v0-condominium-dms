"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { usePathname } from "next/navigation"
import type { User } from "@supabase/supabase-js"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/reportes": "Reportes de Finanzas",
  "/dashboard/balance": "Balance",
  "/dashboard/gastos": "Gastos y Egresos",
  "/dashboard/tipos-gastos": "Tipos de Gastos",
  "/dashboard/casas": "Casas",
  "/dashboard/usuarios": "Usuarios",
  "/dashboard/propietarios": "Residentes",
  "/dashboard/ingresos": "Ingresos",
  "/dashboard/ingreso-variable": "Ingresos Variables",
  "/dashboard/ingresos-multas": "Ingresos por Multas",
  "/dashboard/exoneraciones": "Exoneraciones",
  "/dashboard/tipos-exoneraciones": "Tipos de Exoneraciones",
  "/dashboard/proyectos": "Proyectos",
  "/dashboard/encuestas": "Encuestas",
  "/dashboard/documentos": "Documentos",
  "/dashboard/infracciones": "Infracciones",
  "/dashboard/areas-comunes": "Áreas Comunes",
  "/dashboard/cartolas": "Cartolas Bancarias",
  "/dashboard/conserjes": "Gestión de Conserjes",
  "/dashboard/gestion-reservas": "Gestión de Reservas",
  "/dashboard/visitas-admin": "Gestión de Visitas",
  "/dashboard/encomiendas": "Encomiendas",
  "/dashboard/solicitudes-materiales": "Solicitudes de Materiales",
  "/dashboard/configuracion": "Configuración",
  "/dashboard/alertas": "Alertas",
}

export function DashboardHeader({
  user,
  profile,
  condoName,
}: {
  user: User
  profile: Record<string, unknown> | null
  condoName?: string
}) {
  const pathname = usePathname()
  const residentName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ") || user.user_metadata?.name || user.email?.split("@")[0] || "Residente"
  const isResident = profile?.role === "propietario" || profile?.role === "owner"
  const title = isResident && condoName
    ? `${residentName} - ${condoName}`
    : pageTitles[pathname] || "Dashboard"

  return (
    <header className="flex min-h-14 shrink-0 items-center gap-2 overflow-hidden border-b px-3 sm:px-4">
      <SidebarTrigger className="-ml-1 shrink-0" />
      <Separator orientation="vertical" className="mr-1 h-4 shrink-0 sm:mr-2" />
      <div className="min-w-0 truncate text-base font-bold sm:text-lg">{title}</div>
    </header>
  )
}

