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
  "/dashboard/propietarios": "Propietarios",
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
  "/dashboard/configuracion": "Configuración",
  "/dashboard/alertas": "Alertas",
}

export function DashboardHeader({ user, profile }: { user: User; profile: Record<string, unknown> | null }) {
  const pathname = usePathname()
  const title = pageTitles[pathname] || "Dashboard"

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="text-lg font-bold truncate">{title}</div>
    </header>
  )
}

