'use client'

import { BarChart3, Home, Vote, FileText, ShieldCheck, Building2, ArrowRight, Download, Apple, Smartphone } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    // Detectar si la app corre dentro del contenedor nativo (Capacitor Android/iOS)
    const cap = (window as any).Capacitor
    const isNative = !!(
      cap &&
      (typeof cap.isNativePlatform === 'function' ? cap.isNativePlatform() : cap.isNative)
    )

    if (isNative) {
      setRedirecting(true)
      router.replace('/auth/login')
    }
  }, [router])

  // En la app móvil mostramos un splash mientras redirige, evitando ver la landing
  if (redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
          <Image
            src="/logo.png"
            alt="InteliCon Logo"
            width={160}
            height={54}
            className="h-14 w-auto animate-pulse"
            priority
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 border-b border-border/50" style={{ backgroundColor: "#0d3068" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-auto py-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-xl p-2 border border-gray-100">
              <Image 
                src="/logo.png" 
                alt="InteliCon Logo" 
                width={120} 
                height={40}
                className="h-10 w-auto"
                priority
              />
            </div>
          </div>
          
          {/* Buttons in 2 rows */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <a 
              href="/auth/login" 
              className="px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 whitespace-nowrap"
              style={{ backgroundColor: "#fefce1", color: "#0d3068" }}
            >
              Iniciar Sesión
            </a>
            <a 
              href="/auth/registro" 
              className="px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 whitespace-nowrap"
              style={{ backgroundColor: "#0d3068", color: "#fefce1", borderColor: "#fefce1" }}
            >
              Registrarse
            </a>
          </div>
        </div>
      </nav>
      
      {/* Removed floating logo - now in nav */}

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <div className="inline-block px-4 py-2 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">
            Gestión completa de condominios en una plataforma
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold text-foreground text-balance leading-tight">
            Administra tu condominio de forma integral
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            InteliCon es la plataforma completa para gestionar gastos, ingresos, encuestas, documentos, proyectos y mucho más. Todo en un solo lugar.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a href="/auth/registro" className="relative px-8 py-3.5 bg-primary text-primary-foreground rounded-full font-semibold text-base shadow-xl hover:shadow-2xl overflow-hidden group transition-all duration-300 hover:scale-105 flex items-center gap-2">
              <span className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary to-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center gap-2">
                Comenzar ahora
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </a>
            <a href="/auth/login" className="relative px-8 py-3.5 border-2 border-primary/30 text-foreground rounded-full font-semibold text-base group transition-all duration-300 hover:border-primary hover:bg-primary/5 hover:scale-105">
              <span className="absolute inset-0 bg-primary/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative">Ya tengo cuenta</span>
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold text-foreground">Características principales</h2>
            <p className="text-lg text-muted-foreground">Todo lo que necesitas para administrar tu condominio eficientemente</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BarChart3,
                title: "Reportes Financieros",
                description: "Comparativas por mes, trimestre, semestre y año con gráficos interactivos",
                color: "#3B82F6",
                bgColor: "rgba(59, 130, 246, 0.15)"
              },
              {
                icon: Home,
                title: "Control por Casa",
                description: "Cards de estado por casa, histórico de pagos y comprobantes de depósito",
                color: "#10B981",
                bgColor: "rgba(16, 185, 129, 0.15)"
              },
              {
                icon: Vote,
                title: "Encuestas en Vivo",
                description: "Votaciones en tiempo real con resultados visibles al instante",
                color: "#8B5CF6",
                bgColor: "rgba(139, 92, 246, 0.15)"
              },
              {
                icon: FileText,
                title: "Gestión de Documentos",
                description: "Almacena reglamentos, sanciones, partes y cualquier documentación",
                color: "#F59E0B",
                bgColor: "rgba(245, 158, 11, 0.15)"
              },
              {
                icon: ShieldCheck,
                title: "Exoneraciones",
                description: "Gestiona exoneraciones permanentes o temporales por servicios",
                color: "#14B8A6",
                bgColor: "rgba(20, 184, 166, 0.15)"
              },
              {
                icon: Building2,
                title: "Proyectos de Mejora",
                description: "Crea proyectos con cotizaciones, fotos y seguimiento de estado",
                color: "#EC4899",
                bgColor: "rgba(236, 72, 153, 0.15)"
              },
            ].map((feature) => (
              <div 
                key={feature.title} 
                className="group p-6 bg-background border-2 border-border/50 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{ borderColor: `${feature.color}30` }}
              >
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: feature.bgColor }}
                >
                  <feature.icon className="w-7 h-7" style={{ color: feature.color }} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Download Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Descarga nuestra app móvil</h2>
            <p className="text-base sm:text-lg text-slate-300">Gestiona tu condominio desde cualquier lugar</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
            {/* Android Download */}
            <a 
              href={process.env.NEXT_PUBLIC_ANDROID_APK_URL || '#'}
              download
              className={`flex items-center gap-3 px-8 py-4 ${process.env.NEXT_PUBLIC_ANDROID_APK_URL ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'} text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <Smartphone className="w-6 h-6" />
              <div className="flex flex-col items-start">
                <span className="text-xs opacity-90">Disponible en</span>
                <span className="text-base font-bold">Android</span>
              </div>
            </a>

            {/* iOS Download */}
            <a 
              href="https://apps.apple.com/cl/app/intelicon/id6762440030"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-gray-700"
            >
              <Apple className="w-6 h-6" />
              <div className="flex flex-col items-start">
                <span className="text-xs opacity-90">Descargar en</span>
                <span className="text-base font-bold">App Store</span>
              </div>
            </a>
          </div>


        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div 
          className="max-w-4xl mx-auto text-center space-y-8 border-2 rounded-3xl p-8 sm:p-12"
          style={{ backgroundColor: "#b4d9fe", borderColor: "#0d3068" }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-balance" style={{ color: "#0d3068" }}>¿Listo para transformar tu administración?</h2>
          <p className="text-base sm:text-lg text-balance" style={{ color: "#0d3068", opacity: 0.8 }}>Únete a cientos de condominios que ya confían en InteliCon</p>
          <a 
            href="/auth/registro" 
            className="inline-block px-6 sm:px-8 py-3.5 rounded-full font-semibold text-sm sm:text-base shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            style={{ backgroundColor: "#fefce1", color: "#0d3068" }}
          >
            Comenzar prueba gratuita
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground space-y-4">
          <p>© 2026 InteliCon. Todos los derechos reservados.</p>
          <div className="flex items-center justify-center gap-4 text-xs flex-wrap">
            <a href="/" className="hover:text-foreground transition-colors">Inicio</a>
            <span>•</span>
            <a href="/support" className="hover:text-foreground transition-colors">Soporte</a>
            <span>•</span>
            <a href="/privacy-policy" className="hover:text-foreground transition-colors">Políticas de Privacidad</a>
            <span>•</span>
            <a href="/terms" className="hover:text-foreground transition-colors">Términos de Servicio</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
