import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Building2, BarChart3, Home, Vote, FileText, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role === "super_admin") {
      redirect("/admin")
    } else {
      redirect("/dashboard")
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">CondoAdmin</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="outline">Iniciar Sesión</Button>
          </Link>
          <Link href="/auth/registro">
            <Button>Registrarse</Button>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-12 px-6 py-16">
        <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Administra tu condominio de forma integral
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground text-pretty">
            CondoAdmin es la plataforma completa para gestionar gastos, ingresos, encuestas, documentos, proyectos y mucho más. Todo en un solo lugar.
          </p>
          <div className="flex items-center gap-3 pt-4">
            <Link href="/auth/registro">
              <Button size="lg">Comenzar ahora</Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline">Ya tengo cuenta</Button>
            </Link>
          </div>
        </div>

        <div className="grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: BarChart3, title: "Reportes financieros", desc: "Comparativas por mes, trimestre, semestre y año con gráficos interactivos" },
            { icon: Home, title: "Control por casa", desc: "Cards de estado por casa, histórico de pagos y comprobantes de depósito" },
            { icon: Vote, title: "Encuestas en vivo", desc: "Votaciones en tiempo real con resultados visibles al instante" },
            { icon: FileText, title: "Documentos", desc: "Almacena reglamentos, sanciones, partes y cualquier documentación" },
            { icon: ShieldCheck, title: "Exoneraciones", desc: "Gestiona exoneraciones permanentes o temporales por servicios" },
            { icon: Building2, title: "Proyectos de mejora", desc: "Crea proyectos con cotizaciones, fotos y seguimiento de estado" },
          ].map((feature) => (
            <div key={feature.title} className="flex flex-col gap-2 rounded-xl border bg-card p-6">
              <feature.icon className="h-8 w-8 text-primary" />
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
        CondoAdmin - Sistema de Administración de Condominios
      </footer>
    </div>
  )
}

