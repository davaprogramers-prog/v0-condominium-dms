"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"
import { PeriodSelector } from "./period-selector"
import type { User } from "@supabase/supabase-js"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/gastos": "Gastos",
  "/dashboard/tipos-gastos": "Tipos de Gastos",
  "/dashboard/reportes": "Reportes de Gastos",
  "/dashboard/casas": "Casas",
  "/dashboard/ingresos": "Ingresos / Pagos",
  "/dashboard/ingreso-variable": "Ingreso Variable",
  "/dashboard/exoneraciones": "Exoneraciones",
  "/dashboard/proyectos": "Proyectos de Mejora",
  "/dashboard/encuestas": "Encuestas",
  "/dashboard/documentos": "Documentos",
  "/dashboard/infracciones": "Infracciones",
  "/dashboard/arriendos": "Arriendos",
  "/dashboard/areas-comunes": "Areas Comunes",
  "/dashboard/cartolas": "Cartolas Bancarias",
  "/dashboard/configuracion": "Configuracion",
}

// Pages that should show period selector
const pagesWithPeriod = [
  "/dashboard/gastos",
  "/dashboard/reportes",
  "/dashboard/ingresos",
  "/dashboard/ingreso-variable",
  "/dashboard/cartolas",
]

export function DashboardHeader({ user, profile }: { user: User; profile: Record<string, unknown> | null }) {
  const pathname = usePathname()
  const title = pageTitles[pathname] || "Dashboard"
  const showPeriod = pagesWithPeriod.includes(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      {showPeriod && <PeriodSelector />}
    </header>
  )
}

