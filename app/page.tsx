'use client'

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { BarChart3, Home, Vote, FileText, ShieldCheck, Building2 } from "lucide-react"
import { SiteLogo } from "@/components/site-logo"
import { CompanyLogo } from "@/components/company-logo"

export default function LandingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // If there's a code parameter, redirect to auth callback
    const code = searchParams.get("code")
    if (code) {
      router.replace(`/auth/callback?code=${code}&type=recovery`)
    }
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-col items-center justify-center gap-6 border-b px-4 py-6 sm:px-6 sm:py-8">
        {/* Logos centrados */}
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <SiteLogo />
          <div className="hidden sm:block">
            <CompanyLogo />
          </div>
        </div>
        
        {/* Botones centrados */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
          <Link href="/auth/login" className="px-6 py-2 text-sm sm:text-base border rounded-md hover:bg-gray-100 whitespace-nowrap text-center">
            Iniciar Sesión
          </Link>
          <Link href="/auth/registro" className="px-6 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap text-center">
            Registrarse
          </Link>
        </div>
        
        {/* Logo empresa en móvil centrado */}
        <div className="sm:hidden">
          <CompanyLogo />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-12 px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">
            Administra tu condominio de forma integral
          </h1>
          <p className="text-base text-gray-600 sm:text-lg">
            InteliCon es la plataforma completa para gestionar gastos, ingresos, encuestas, documentos, proyectos y mucho más. Todo en un solo lugar.
          </p>
          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <Link href="/auth/registro" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-center">
              Comenzar ahora
            </Link>
            <Link href="/auth/login" className="px-6 py-2 border rounded-md hover:bg-gray-100 font-medium text-center">
              Ya tengo cuenta
            </Link>
          </div>
        </div>

        <div className="w-full grid max-w-4xl grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: BarChart3, title: "Reportes financieros", desc: "Comparativas por mes, trimestre, semestre y año con gráficos interactivos" },
            { icon: Home, title: "Control por casa", desc: "Cards de estado por casa, histórico de pagos y comprobantes de depósito" },
            { icon: Vote, title: "Encuestas en vivo", desc: "Votaciones en tiempo real con resultados visibles al instante" },
            { icon: FileText, title: "Documentos", desc: "Almacena reglamentos, sanciones, partes y cualquier documentación" },
            { icon: ShieldCheck, title: "Exoneraciones", desc: "Gestiona exoneraciones permanentes o temporales por servicios" },
            { icon: Building2, title: "Proyectos de mejora", desc: "Crea proyectos con cotizaciones, fotos y seguimiento de estado" },
          ].map((feature) => (
            <div key={feature.title} className="flex flex-col gap-2 rounded-xl border bg-white p-6 shadow-sm">
              <feature.icon className="h-8 w-8 text-blue-600" />
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t px-4 py-6 text-center text-xs text-gray-600 sm:px-6 sm:text-sm">
        InteliCon - Sistema de Administración de Condominios
      </footer>
    </div>
  )
}

