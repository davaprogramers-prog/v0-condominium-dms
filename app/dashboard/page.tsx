import { createClient } from "@/lib/supabase/server"
import { Home, Users, DollarSign, FileText, Settings } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, condo_id, first_name")
    .eq("id", user?.id)
    .single()

  const { data: condo } = await supabase
    .from("condominiums")
    .select("name")
    .eq("id", profile?.condo_id)
    .single()

  const menuItems = [
    { href: "/dashboard/casas", icon: Home, label: "Casas", desc: "Gestión de propiedades" },
    { href: "/dashboard/usuarios", icon: Users, label: "Usuarios", desc: "Administrar residentes" },
    { href: "/dashboard/gastos", icon: DollarSign, label: "Gastos", desc: "Registrar gastos comunes" },
    { href: "/dashboard/documentos", icon: FileText, label: "Documentos", desc: "Documentación importante" },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Bienvenido, {profile?.first_name}</h1>
            <p className="text-muted-foreground">{condo?.name || "Condominio"}</p>
          </div>
          <Link href="/dashboard/configuracion">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {menuItems.map((item) => (
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
    </div>
  )
}
