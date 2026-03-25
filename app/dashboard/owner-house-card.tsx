"use client"

import { useState } from "react"
import { Home, ChevronDown, DollarSign, Newspapers, LayoutGrid, FileText, AlertCircle, FileCheck, BarChart3, TrendingDown, Trees } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface OwnerHouseCardProps {
  house: {
    id: string
    house_number: number
    owner_name: string
    owner_email: string
  }
  condoName: string
}

const menuItems = [
  { href: "/dashboard/mi-casa/balance", icon: DollarSign, label: "Balance", desc: "Ver tu saldo" },
  { href: "/dashboard/mi-casa/encuestas", icon: Newspapers, label: "Encuestas", desc: "Participar en encuestas" },
  { href: "/dashboard/mi-casa/proyectos", icon: LayoutGrid, label: "Proyectos", desc: "Proyectos activos" },
  { href: "/dashboard/mi-casa/documentos", icon: FileText, label: "Documentos", desc: "Tus documentos" },
  { href: "/dashboard/mi-casa/infracciones", icon: AlertCircle, label: "Infracciones", desc: "Historial de infracciones" },
  { href: "/dashboard/mi-casa/cartolas", icon: FileCheck, label: "Cartolas", desc: "Tus cartolas" },
  { href: "/dashboard/mi-casa/reportes", icon: BarChart3, label: "Reportes", desc: "Ver reportes" },
  { href: "/dashboard/mi-casa/gastos", icon: TrendingDown, label: "Gastos", desc: "Detalle de gastos" },
  { href: "/dashboard/mi-casa/areas-comunes", icon: Trees, label: "Áreas Comunes", desc: "Información de áreas" },
]

export function OwnerHouseCard({ house, condoName }: OwnerHouseCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-3">
            <Home className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Casa #{house.house_number}</h3>
            <p className="text-sm text-muted-foreground">{condoName}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{house.owner_name}</p>
              <p className="text-xs text-muted-foreground">{house.owner_email}</p>
            </div>
            <DropdownMenuSeparator />
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <DropdownMenuItem className="cursor-pointer">
                  <item.icon className="h-4 w-4 mr-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </DropdownMenuItem>
              </Link>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Propietario:</span>
          <span className="font-medium">{house.owner_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Email:</span>
          <span className="font-medium text-xs truncate">{house.owner_email}</span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Link href="/dashboard/mi-casa/balance">
          <Button variant="outline" size="sm" className="w-full text-xs" asChild>
            <span>Balance</span>
          </Button>
        </Link>
        <Link href="/dashboard/mi-casa/cartolas">
          <Button variant="outline" size="sm" className="w-full text-xs" asChild>
            <span>Cartola</span>
          </Button>
        </Link>
        <Link href="/dashboard/mi-casa/documentos">
          <Button variant="outline" size="sm" className="w-full text-xs" asChild>
            <span>Docs</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
