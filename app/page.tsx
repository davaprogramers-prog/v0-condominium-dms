'use client'

import Link from "next/link"
import Image from "next/image"
import { BarChart3, Home, Vote, FileText, ShieldCheck, Building2 } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center">
          <div className="text-xl font-bold">InteliCon</div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="px-4 py-2 border rounded-md hover:bg-gray-100">
            Iniciar Sesión
          </Link>
          <Link href="/auth/registro" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Registrarse
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-12 px-6 py-16">
        <div className="flex max-w-2xl flex-col items-center gap-4 text-center">
          <h1 className="text-4xl font-bold">
            Administra tu condominio de forma integral
          </h1>
          <p className="text-lg text-gray-600">
            InteliCon es la plataforma completa para gestionar gastos, ingresos, encuestas, documentos, proyectos y mucho más. Todo en un solo lugar.
          </p>
          <div className="flex items-center gap-3 pt-4">
            <Link href="/auth/registro" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">
              Comenzar ahora
            </Link>
            <Link href="/auth/login" className="px-6 py-2 border rounded-md hover:bg-gray-100 font-medium">
              Ya tengo cuenta
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
            <div key={feature.title} className="flex flex-col gap-2 rounded-xl border bg-white p-6 shadow-sm">
              <feature.icon className="h-8 w-8 text-blue-600" />
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t px-6 py-6 text-center text-sm text-gray-600">
        InteliCon - Sistema de Administración de Condominios
      </footer>
    </div>
  )
}

