'use client'

import { ArrowLeft, HelpCircle, Mail, Phone, Clock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function SupportPage() {
  const faqs = [
    {
      question: "¿Cómo registro mi condominio en la plataforma?",
      answer: "Para registrar tu condominio, envía un correo a publicidad@dmsinnova.cl indicando tus datos. Nuestro equipo de asesoría se pondrá en contacto contigo para guiarte en el proceso de registro y asegurar que recibas un mejor servicio personalizado."
    },
    {
      question: "¿Cómo agrego usuarios a mi condominio?",
      answer: "Una vez en el dashboard, ve a la sección 'Usuarios'. Haz clic en el botón 'Nuevo Usuario' y completa los datos del usuario. Puedes asignar diferentes roles (administrador, conserje, residente) según las necesidades."
    },
    {
      question: "¿Cómo registro los gastos del condominio?",
      answer: "En la sección 'Gastos', haz clic en 'Agregar Gastos'. Completa los detalles del gasto (concepto, monto, categoría, fecha). El sistema registrará automáticamente el gasto para la administración contable."
    },
    {
      question: "¿Cómo genero reportes financieros?",
      answer: "Ve a la sección 'Reportes de Finanzas' o 'Balance'. Selecciona el período que deseas analizar. La plataforma generará automáticamente un resumen con ingresos, egresos y balance del período."
    },
    {
      question: "¿Puedo exportar la información?",
      answer: "Actualmente, la exportación de datos está en desarrollo. Si necesitas exportar información específica, por favor solicita asesoría escribiendo a publicidad@dmsinnova.cl y nuestro equipo te ayudará. Implementaremos esta funcionalidad próximamente."
    },
    {
      question: "¿Cómo restablezco mi contraseña?",
      answer: "En la página de login, haz clic en '¿Olvidé mi contraseña?'. Ingresa tu email registrado y recibirás un enlace para restablecer tu contraseña. El enlace es válido por 24 horas."
    },
    {
      question: "¿Puedo cambiar mi rol de usuario?",
      answer: "Por políticas de diseño, los roles no pueden ser cambiados una vez asignados. Si necesitas acceso a funciones de otro rol, debes registrarte con otro correo electrónico. Contacta al administrador de tu condominio para que cree una nueva cuenta con el rol requerido."
    }
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 border-b border-border/50" style={{ backgroundColor: "#0d3068" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Volver</span>
          </Link>
          <h1 className="text-lg font-bold text-white">Soporte</h1>
          <div className="w-16"></div>
        </div>
      </nav>

      {/* Floating Logo */}
      <div className="fixed top-4 left-4 sm:left-8 z-50">
        <div className="bg-white rounded-2xl shadow-xl p-3 border border-gray-100">
          <Image 
            src="/logo.png" 
            alt="InteliCon Logo" 
            width={150} 
            height={50}
            className="h-12 w-auto"
            priority
          />
        </div>
      </div>

      {/* Content */}
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 flex-1">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <div className="space-y-4 mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground">Soporte</h1>
            <p className="text-lg text-muted-foreground">Encuentra respuestas y obtén ayuda con tus consultas</p>
          </div>

          {/* Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Email Support */}
            <a
              href="mailto:soporte@dmsinnova.cl"
              className="p-6 border border-border rounded-lg hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <Mail className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-foreground">Email de Soporte</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                Envía tus consultas a: <span className="font-semibold text-foreground">soporte@dmsinnova.cl</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">Respuesta en 24 horas</p>
            </a>

            {/* Availability */}
            <div className="p-6 border border-border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-6 h-6 text-green-600" />
                <h3 className="font-semibold text-foreground">Disponibilidad</h3>
              </div>
              <p className="text-muted-foreground text-sm">
                Atendemos de lunes a viernes de 09:00 a 18:00 horas (Hora Chile)
              </p>
              <p className="text-xs text-muted-foreground mt-2">Soporte básico 24/7</p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-foreground">Preguntas Frecuentes</h2>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <details key={index} className="p-6 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <summary className="font-semibold text-foreground flex items-center justify-between">
                    <span>{faq.question}</span>
                    <span className="text-muted-foreground">+</span>
                  </summary>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>

          {/* Additional Help */}
          <div className="bg-muted/50 p-8 rounded-lg space-y-4 border border-border">
            <h3 className="text-lg font-semibold text-foreground">¿No encontraste lo que buscas?</h3>
            <p className="text-muted-foreground">
              Si tu consulta no está en las preguntas frecuentes, no dudes en contactarnos. Nuestro equipo de soporte estará encantado de ayudarte a resolver cualquier problema o duda que tengas sobre la plataforma.
            </p>
            <Link
              href="/contact"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Enviar Consulta
            </Link>
          </div>

          {/* Footer Links */}
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>
              Consulta también nuestras{" "}
              <Link href="/privacy-policy" className="text-blue-600 hover:underline">
                Políticas de Privacidad
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 py-8 px-4 sm:px-6 lg:px-8">
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
