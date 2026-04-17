'use client'

import Link from "next/link"
import Image from "next/image"

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-white rounded-lg shadow p-1 border border-gray-100">
              <Image 
                src="/logo.png" 
                alt="InteliCon Logo" 
                width={100} 
                height={35}
                className="h-8 w-auto"
              />
            </div>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Volver
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Términos de Servicio</h1>
          <p className="text-muted-foreground">Última actualización: Abril 2026</p>
        </div>

        {/* Introduction */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">1. Aceptación de Términos</h2>
          <p className="text-foreground/90">
            Al acceder y utilizar InteliCon (la "Plataforma"), aceptas estar vinculado por estos Términos de Servicio. 
            Si no estás de acuerdo con alguno de estos términos, por favor no utilices la Plataforma.
          </p>
        </section>

        {/* Use License */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">2. Licencia de Uso</h2>
          <p className="text-foreground/90">
            Se te otorga una licencia limitada, no exclusiva y revocable para usar la Plataforma únicamente para fines 
            legítimos relacionados con la administración de tu condominio. Está prohibido:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground/90">
            <li>Reproducir, duplicar o copiar el contenido de la Plataforma</li>
            <li>Acceder a la Plataforma de forma no autorizada o mediante métodos no previstos</li>
            <li>Usar la Plataforma para propósitos ilegales o malintencionados</li>
            <li>Compartir accesos de usuario o credenciales con terceros</li>
            <li>Intentar sobrecargar o interrumpir los servidores</li>
          </ul>
        </section>

        {/* User Responsibilities */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">3. Responsabilidades del Usuario</h2>
          <p className="text-foreground/90">
            Como usuario de la Plataforma, eres responsable de:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground/90">
            <li>Mantener la confidencialidad de tu contraseña y credenciales</li>
            <li>Proporcionar información precisa y actualizada en tu perfil</li>
            <li>Notificar inmediatamente de cualquier uso no autorizado de tu cuenta</li>
            <li>Cumplir con todas las leyes y regulaciones aplicables</li>
            <li>Utilizar la Plataforma únicamente para fines legales</li>
          </ul>
        </section>

        {/* Data and Privacy */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">4. Datos y Privacidad</h2>
          <p className="text-foreground/90">
            La información que almacenas en la Plataforma es tu responsabilidad. Te recomendamos:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground/90">
            <li>Revisar nuestra Política de Privacidad para entender cómo manejamos tus datos</li>
            <li>Mantener copias de seguridad de información crítica</li>
            <li>Usar contraseñas fuertes y cambiarlas regularmente</li>
          </ul>
          <p className="text-foreground/90">
            Aunque implementamos medidas de seguridad, no garantizamos la protección absoluta contra ataques cibernéticos 
            o acceso no autorizado. InteliCon no es responsable por la pérdida de datos resultante de tu negligencia.
          </p>
        </section>

        {/* Service Availability */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">5. Disponibilidad del Servicio</h2>
          <p className="text-foreground/90">
            Nos esforzamos por mantener la Plataforma disponible 24/7, pero no garantizamos:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground/90">
            <li>Funcionamiento ininterrumpido de la Plataforma</li>
            <li>Ausencia de errores o defectos técnicos</li>
            <li>Disponibilidad durante mantenimiento programado o emergencias</li>
          </ul>
          <p className="text-foreground/90">
            InteliCon no es responsable por interrupciones de servicio fuera de nuestro control (fallas de internet, 
            problemas de infraestructura, etc.).
          </p>
        </section>

        {/* Modifications to Service */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">6. Cambios en el Servicio</h2>
          <p className="text-foreground/90">
            Nos reservamos el derecho de modificar, suspender o descontinuar cualquier aspecto de la Plataforma en cualquier 
            momento, con o sin previo aviso. No seremos responsables por cualquier cambio, suspensión o discontinuación del servicio.
          </p>
        </section>

        {/* Limitation of Liability */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">7. Limitación de Responsabilidad</h2>
          <p className="text-foreground/90">
            <strong>EN LA MEDIDA PERMITIDA POR LA LEY, InteliCon NO SERÁ RESPONSABLE POR:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground/90">
            <li>Daños indirectos, incidentales o consecuentes</li>
            <li>Pérdida de datos, ingresos o ganancias</li>
            <li>Errores en los datos o cálculos realizados por la Plataforma</li>
            <li>Daños causados por el uso o mal uso de la Plataforma</li>
          </ul>
          <p className="text-foreground/90">
            Nuestra responsabilidad total no excederá el monto pagado por el servicio en los últimos 12 meses.
          </p>
        </section>

        {/* No Professional Advice */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">8. Sin Asesoría Profesional</h2>
          <p className="text-foreground/90">
            InteliCon proporciona una herramienta de gestión administrativa. La Plataforma NO proporciona:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground/90">
            <li>Asesoría legal, fiscal o financiera profesional</li>
            <li>Garantías sobre la precisión legal de los documentos generados</li>
            <li>Reemplazo de consultoría profesional requerida por ley</li>
          </ul>
          <p className="text-foreground/90">
            Te recomendamos consultar con profesionales calificados para asuntos legales, fiscales o financieros críticos.
          </p>
        </section>

        {/* User Content */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">9. Contenido del Usuario</h2>
          <p className="text-foreground/90">
            Eres propietario de todo el contenido que subas a la Plataforma. Al usar nuestros servicios, nos otorgas permiso 
            para almacenar y procesar este contenido únicamente para proporcionar nuestro servicio.
          </p>
          <p className="text-foreground/90">
            No utilizaremos tu contenido para fines comerciales sin tu consentimiento explícito.
          </p>
        </section>

        {/* Account Termination */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">10. Terminación de Cuenta</h2>
          <p className="text-foreground/90">
            Podemos suspender o eliminar tu cuenta si:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground/90">
            <li>Violas estos Términos de Servicio</li>
            <li>Usas la Plataforma para actividades ilegales</li>
            <li>No accedes a la cuenta durante 12 meses consecutivos (previo aviso)</li>
          </ul>
          <p className="text-foreground/90">
            Puedes eliminar tu cuenta en cualquier momento desde la configuración de tu perfil.
          </p>
        </section>

        {/* Contact */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">11. Contacto</h2>
          <p className="text-foreground/90">
            Si tienes preguntas sobre estos Términos de Servicio, por favor contacta a:
          </p>
          <p className="text-foreground/90">
            <strong>Email:</strong> <a href="mailto:publicidad@dmsinnova.cl" className="text-blue-600 hover:underline">publicidad@dmsinnova.cl</a>
          </p>
        </section>

        {/* Changes to Terms */}
        <section className="space-y-4 pb-12">
          <h2 className="text-2xl font-bold text-foreground">12. Cambios en los Términos</h2>
          <p className="text-foreground/90">
            Nos reservamos el derecho de actualizar estos Términos de Servicio en cualquier momento. Los cambios significativos 
            serán comunicados a través de la Plataforma. Tu uso continuado de la Plataforma después de cambios constituye tu 
            aceptación de los nuevos términos.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground space-y-4">
          <p>© 2026 InteliCon. Todos los derechos reservados.</p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <a href="/" className="hover:text-foreground transition-colors">Inicio</a>
            <span>•</span>
            <a href="/support" className="hover:text-foreground transition-colors">Soporte</a>
            <span>•</span>
            <a href="/privacy-policy" className="hover:text-foreground transition-colors">Políticas de Privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
