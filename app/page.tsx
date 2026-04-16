import { BarChart3, Home, Vote, FileText, ShieldCheck, Building2, ArrowRight } from 'lucide-react'
import Image from 'next/image'

export default function Page() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-screen z-40 border-b border-border/50 overflow-hidden" style={{ backgroundColor: "#0d3068" }}>
        <div className="w-full h-auto sm:h-20 py-3 sm:py-0 flex flex-col sm:flex-row sm:items-center sm:justify-end px-4 sm:px-6 lg:px-8 gap-2 sm:gap-3">
          <div className="flex flex-col gap-2 ml-auto pr-2">
            <a 
              href="/auth/login" 
              className="px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-center whitespace-nowrap"
              style={{ backgroundColor: "#fefce1", color: "#0d3068" }}
            >
              Iniciar Sesión
            </a>
            <a 
              href="/auth/registro" 
              className="px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 text-center whitespace-nowrap"
              style={{ backgroundColor: "#0d3068", color: "#fefce1", borderColor: "#fefce1" }}
            >
              Registrarse
            </a>
          </div>
        </div>
      </nav>
      
      {/* Floating Logo */}
      <div className="fixed top-3 left-4 sm:left-8 z-50 sm:z-50">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-2 sm:p-3 border border-gray-100">
          <Image 
            src="/logo.png" 
            alt="InteliCon Logo" 
            width={150} 
            height={50}
            className="h-10 sm:h-12 w-auto"
            priority
          />
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-40 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center space-y-6 sm:space-y-8">
          {/* App Store Badges */}
          <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 mb-2">
            <a 
              href="#" 
              className="w-full sm:w-auto flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{ backgroundColor: "#0d3068" }}
            >
              <svg viewBox="0 0 24 24" className="w-6 sm:w-8 h-6 sm:h-8 flex-shrink-0" fill="#fefce1">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <div className="text-left">
                <p className="text-xs" style={{ color: "#fefce1", opacity: 0.8 }}>Descargar en</p>
                <p className="text-base sm:text-lg font-semibold" style={{ color: "#fefce1" }}>App Store</p>
              </div>
            </a>
            <a 
              href="/apk/intelicon.apk"
              download="InteliCon.apk"
              className="w-full sm:w-auto flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{ backgroundColor: "#0d3068" }}
            >
              <svg viewBox="0 0 24 24" className="w-6 sm:w-8 h-6 sm:h-8 flex-shrink-0" fill="#fefce1">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
              </svg>
              <div className="text-left">
                <p className="text-xs" style={{ color: "#fefce1", opacity: 0.8 }}>Descargar para</p>
                <p className="text-base sm:text-lg font-semibold" style={{ color: "#fefce1" }}>Android</p>
              </div>
            </a>
          </div>
          
          <div className="inline-block px-4 py-2 bg-secondary text-secondary-foreground rounded-full text-xs sm:text-sm font-medium">
            Gestión completa de condominios en una plataforma
          </div>
          
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground text-balance leading-tight">
            Administra tu condominio de forma integral
          </h1>
          
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
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

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div 
          className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-8 border-2 rounded-2xl sm:rounded-3xl p-6 sm:p-12"
          style={{ backgroundColor: "#b4d9fe", borderColor: "#0d3068" }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: "#0d3068" }}>
            ¿Listo para transformar tu administración?
          </h2>
          <p className="text-base sm:text-lg" style={{ color: "#0d3068", opacity: 0.8 }}>
            Únete a cientos de condominios que ya confían en InteliCon
          </p>
          <a 
            href="/auth/registro" 
            className="inline-block px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-semibold text-sm sm:text-base shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            style={{ backgroundColor: "#fefce1", color: "#0d3068" }}
          >
            Comenzar prueba gratuita
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2026 InteliCon. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
