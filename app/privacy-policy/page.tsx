'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 border-b border-border/50" style={{ backgroundColor: "#0d3068" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Volver</span>
          </Link>
          <h1 className="text-lg font-bold text-white">Políticas de Privacidad</h1>
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
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4 mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground">Políticas de Privacidad</h1>
            <p className="text-lg text-muted-foreground">Última actualización: Abril 2026</p>
          </div>

          {/* Introduction */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Introducción</h2>
            <p className="text-muted-foreground leading-relaxed">
              InteliCon ("nosotros", "nuestro" o "la Plataforma") se compromete a proteger tu privacidad. Esta Política de Privacidad explica cómo recopilamos, utilizamos, divulgamos y guardamos tu información cuando utilizas nuestra plataforma de gestión de condominios.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Es fundamental que leas esta política de privacidad cuidadosamente para entender nuestras prácticas de privacidad. Si no estás de acuerdo con nuestras políticas y prácticas, por favor no utilices nuestros servicios.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="space-y-4 border-t pt-8">
            <h2 className="text-2xl font-bold text-foreground">Información que Recopilamos</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Información Personal</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Cuando te registras en InteliCon, recopilamos información personal como:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2 ml-2">
                  <li>Nombre completo</li>
                  <li>Correo electrónico</li>
                  <li>Número de teléfono</li>
                  <li>Dirección física</li>
                  <li>Información de la propiedad (número de casa, condominio)</li>
                  <li>Datos bancarios para transacciones (cuando aplique)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Información de Uso</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Recopilamos automáticamente cierta información sobre cómo interactúas con la Plataforma:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2 ml-2">
                  <li>Registro de actividad de inicio de sesión</li>
                  <li>Acciones realizadas dentro de la plataforma</li>
                  <li>Dispositivo e información del navegador</li>
                  <li>Dirección IP</li>
                  <li>Páginas visitadas y tiempo de permanencia</li>
                  <li>Cookies y tecnologías similares</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Información de Transacciones</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Cuando realizas transacciones financieras en la Plataforma, recopilamos información sobre los pagos, facturas, recibos y comprobantes de transacción.
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section className="space-y-4 border-t pt-8">
            <h2 className="text-2xl font-bold text-foreground">Cómo Usamos Tu Información</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos la información que recopilamos para los siguientes propósitos:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
              <li>Proporcionar y mejorar nuestros servicios</li>
              <li>Gestionar tu cuenta y procesar transacciones</li>
              <li>Enviar notificaciones importantes sobre cambios en nuestros servicios</li>
              <li>Responder a tus consultas y solicitudes de soporte</li>
              <li>Prevenir fraude y abusos en la Plataforma</li>
              <li>Cumplir con obligaciones legales y regulatorias</li>
              <li>Personalizar tu experiencia en la Plataforma</li>
              <li>Análisis de datos para mejorar nuestros servicios</li>
              <li>Enviar comunicaciones comerciales con tu consentimiento</li>
            </ul>
          </section>

          {/* Data Protection */}
          <section className="space-y-4 border-t pt-8">
            <h2 className="text-2xl font-bold text-foreground">Protección de Datos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger tu información personal contra acceso no autorizado, alteración, divulgación o destrucción. Estas medidas incluyen:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
              <li>Encriptación SSL de datos en tránsito</li>
              <li>Autenticación de dos factores (2FA)</li>
              <li>Almacenamiento seguro de contraseñas con hash</li>
              <li>Acceso restringido a datos sensibles</li>
              <li>Auditorías de seguridad regulares</li>
              <li>Cumplimiento con estándares de seguridad internacionales</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Sin embargo, ningún método de transmisión por Internet es 100% seguro. Aunque hacemos nuestro mejor esfuerzo para proteger tu información, no podemos garantizar su seguridad absoluta.
            </p>
          </section>

          {/* Data Retention */}
          <section className="space-y-4 border-t pt-8">
            <h2 className="text-2xl font-bold text-foreground">Retención de Datos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Retenemos tu información personal durante el tiempo que tu cuenta esté activa o según sea necesario para proporcionar nuestros servicios. Si deseas que eliminemos tu información, puedes solicitar la eliminación de tu cuenta contactándonos a través de los detalles de contacto proporcionados a continuación.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Algunos datos pueden ser retenidos más tiempo si es requerido por ley o por razones legítimas de negocio (como auditoría o cumplimiento legal).
            </p>
          </section>

          {/* User Rights */}
          <section className="space-y-4 border-t pt-8">
            <h2 className="text-2xl font-bold text-foreground">Tus Derechos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Tienes los siguientes derechos con respecto a tu información personal:
            </p>
            <div className="space-y-3 ml-2">
              <div>
                <h3 className="font-semibold text-foreground mb-1">Derecho de Acceso</h3>
                <p className="text-muted-foreground text-sm">Puedes solicitar acceso a tu información personal en cualquier momento.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Derecho de Rectificación</h3>
                <p className="text-muted-foreground text-sm">Puedes corregir o actualizar tu información personal si es inexacta o incompleta.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Derecho de Eliminación</h3>
                <p className="text-muted-foreground text-sm">Puedes solicitar la eliminación de tu información personal, sujeto a obligaciones legales.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Derecho a la Portabilidad</h3>
                <p className="text-muted-foreground text-sm">Puedes solicitar recibir tus datos en un formato estructurado y transportable.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Derecho a Oponerme</h3>
                <p className="text-muted-foreground text-sm">Puedes oponerte al procesamiento de tu información para ciertos propósitos.</p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Derecho de No Consentimiento</h3>
                <p className="text-muted-foreground text-sm">Puedes retirar tu consentimiento en cualquier momento si es la base del procesamiento.</p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Para ejercer cualquiera de estos derechos, por favor contacta con nosotros utilizando la información de contacto proporcionada a continuación.
            </p>
          </section>

          {/* Third Party Sharing */}
          <section className="space-y-4 border-t pt-8">
            <h2 className="text-2xl font-bold text-foreground">Compartición con Terceros</h2>
            <p className="text-muted-foreground leading-relaxed">
              No vendemos tu información personal a terceros. Sin embargo, podemos compartir tu información en las siguientes circunstancias:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
              <li><strong>Con proveedores de servicios:</strong> Compartimos información con empresas que nos ayudan a operar la Plataforma (hosting, análisis, etc.)</li>
              <li><strong>Por requisito legal:</strong> Cuando es requerido por ley, orden judicial o autoridades gubernamentales</li>
              <li><strong>Para protección:</strong> Cuando es necesario para proteger la seguridad, privacidad o derechos de InteliCon, nuestros usuarios o el público</li>
              <li><strong>Con consentimiento:</strong> Cuando tú has dado consentimiento específico para compartir</li>
            </ul>
          </section>

          {/* Cookies */}
          <section className="space-y-4 border-t pt-8">
            <h2 className="text-2xl font-bold text-foreground">Cookies y Tecnologías Similares</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos cookies y tecnologías similares para mejorar tu experiencia en la Plataforma. Las cookies son pequeños archivos almacenados en tu dispositivo que nos ayudan a:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
              <li>Recordar tus preferencias</li>
              <li>Mantener tu sesión activa</li>
              <li>Entender cómo utilizas la Plataforma</li>
              <li>Mejorar el rendimiento y seguridad</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Puedes controlar las cookies a través de la configuración de tu navegador. Ten en cuenta que desactivar las cookies puede afectar la funcionalidad de la Plataforma.
            </p>
          </section>

          {/* Changes to Policy */}
          <section className="space-y-4 border-t pt-8">
            <h2 className="text-2xl font-bold text-foreground">Cambios en Esta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              InteliCon se reserva el derecho de modificar esta Política de Privacidad en cualquier momento. Los cambios serán efectivos inmediatamente tras la publicación de la política revisada en la Plataforma. Tu uso continuado de la Plataforma después de cambios constituye tu aceptación de la política revisada.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Te notificaremos sobre cambios significativos mediante correo electrónico o un aviso prominente en la Plataforma.
            </p>
          </section>

          {/* Contact Information */}
          <section className="space-y-4 border-t pt-8 pb-8">
            <h2 className="text-2xl font-bold text-foreground">Contacto</h2>
            <p className="text-muted-foreground leading-relaxed">
              Si tienes preguntas, inquietudes o solicitudes relacionadas con esta Política de Privacidad o nuestras prácticas de privacidad, por favor contacta con nosotros en:
            </p>
            <div className="bg-secondary/30 p-6 rounded-lg space-y-2 mt-4">
              <p className="text-foreground"><strong>Email:</strong> <a href="mailto:publicidad@dmsinnova.cl" className="text-blue-600 hover:underline">publicidad@dmsinnova.cl</a></p>
              <p className="text-foreground"><strong>Dirección:</strong> InteliCon, Gestión de Condominios, Chile</p>
              <p className="text-muted-foreground text-sm mt-4">
                Responderemos a tus solicitudes dentro de 30 días hábiles.
              </p>
            </div>
          </section>

          {/* Acknowledgment */}
          <div className="bg-primary/10 border border-primary/20 p-6 rounded-lg mt-12 space-y-3">
            <p className="text-foreground font-semibold">Aceptación de Términos</p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Al utilizar InteliCon, reconoces que has leído, entendido y aceptas esta Política de Privacidad. Si no estás de acuerdo con estas condiciones, por favor no utilices la Plataforma.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground space-y-2">
          <p>© 2026 InteliCon. Todos los derechos reservados.</p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <Link href="/" className="hover:text-foreground transition-colors">Inicio</Link>
            <span>•</span>
            <Link href="/privacy-policy" className="hover:text-foreground transition-colors font-semibold">Privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
