import { BarChart3, Home, Vote, FileText, ShieldCheck, Building2, ArrowRight } from 'lucide-react'

export default function Page() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">InteliCon</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/auth/login" className="px-4 py-2 text-sm text-foreground hover:text-primary transition">
              Iniciar Sesión
            </a>
            <a href="/auth/registro" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition">
              Registrarse
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
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
            <a href="/auth/registro" className="group px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition flex items-center gap-2 font-medium">
              Comenzar ahora
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </a>
            <a href="/auth/login" className="px-6 py-3 border border-border rounded-lg text-foreground hover:bg-secondary transition font-medium">
              Ya tengo cuenta
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
                description: "Comparativas por mes, trimestre, semestre y año con gráficos interactivos"
              },
              {
                icon: Home,
                title: "Control por Casa",
                description: "Cards de estado por casa, histórico de pagos y comprobantes de depósito"
              },
              {
                icon: Vote,
                title: "Encuestas en Vivo",
                description: "Votaciones en tiempo real con resultados visibles al instante"
              },
              {
                icon: FileText,
                title: "Gestión de Documentos",
                description: "Almacena reglamentos, sanciones, partes y cualquier documentación"
              },
              {
                icon: ShieldCheck,
                title: "Exoneraciones",
                description: "Gestiona exoneraciones permanentes o temporales por servicios"
              },
              {
                icon: Building2,
                title: "Proyectos de Mejora",
                description: "Crea proyectos con cotizaciones, fotos y seguimiento de estado"
              },
            ].map((feature) => (
              <div key={feature.title} className="group p-6 bg-background border border-border rounded-xl hover:border-primary/50 hover:shadow-lg transition">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8 bg-primary/5 border border-primary/20 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-foreground">¿Listo para transformar tu administración?</h2>
          <p className="text-lg text-muted-foreground">Únete a cientos de condominios que ya confían en InteliCon</p>
          <a href="/auth/registro" className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-semibold">
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
