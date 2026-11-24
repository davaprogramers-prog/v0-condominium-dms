import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Mail, Phone } from "lucide-react"
import { FormularioContacto } from "./formulario-contacto"

export const metadata: Metadata = {
  title: "Contacto y cotización - InteliCon",
  description: "Solicita una cotización de InteliCon para la administración de tu condominio.",
}

export default function ContactoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fefce1]">
      <header className="w-full" style={{ backgroundColor: "#0d3068" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" aria-label="Volver al inicio" className="rounded-2xl border border-gray-100 bg-white p-2 shadow-xl">
            <Image src="/logo.png" alt="InteliCon" width={120} height={40} className="h-10 w-auto" priority />
          </Link>
          <Link
            href="/auth/login"
            className="whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold shadow-lg sm:px-6 sm:text-sm"
            style={{ backgroundColor: "#fefce1", color: "#0d3068" }}
          >
            Iniciar Sesión
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:py-16">
        <section className="flex flex-col gap-6 text-[#0d3068] lg:w-2/5">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium hover:underline">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Volver al inicio
          </Link>
          <h1 className="text-balance text-4xl font-bold leading-tight">Cotiza InteliCon para tu condominio</h1>
          <p className="text-pretty leading-relaxed text-[#0d3068]/80">
            Déjanos tus datos y te contactaremos para mostrarte la plataforma y preparar una cotización según el
            tamaño y las necesidades de tu comunidad.
          </p>

          <div className="flex flex-col gap-4 rounded-2xl border-2 border-[#0d3068] bg-[#b4d9fe] p-5">
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold">Teléfono de contacto en caso de emergencias</p>
                <a href="tel:+56959261524" className="text-lg font-bold hover:underline">
                  +56 9 59261524
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold">Correo</p>
                <a href="mailto:publicidad@dmsinnova.cl" className="break-all font-medium hover:underline">
                  publicidad@dmsinnova.cl
                </a>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="titulo-formulario" className="flex flex-col gap-5 rounded-3xl border-2 border-[#0d3068]/20 bg-white p-6 shadow-xl sm:p-8 lg:w-3/5">
          <div className="flex flex-col gap-1">
            <h2 id="titulo-formulario" className="text-2xl font-bold text-[#0d3068]">
              Solicitar cotización
            </h2>
            <p className="text-sm text-[#0d3068]/70">Todos los campos son obligatorios.</p>
          </div>
          <FormularioContacto />
        </section>
      </main>

      <footer className="border-t border-[#0d3068]/15 px-4 py-6 text-center text-sm text-[#0d3068]/70">
        © 2026 InteliCon. Todos los derechos reservados.
      </footer>
    </div>
  )
}
