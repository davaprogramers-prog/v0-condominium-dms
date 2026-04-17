'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    condominio: '',
    type: 'consulta',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setSubmitted(true)
        setFormData({ name: '', email: '', phone: '', condominio: '', type: 'consulta', message: '' })
        setTimeout(() => setSubmitted(false), 5000)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 border-b border-border/50" style={{ backgroundColor: "#0d3068" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/support" className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Volver</span>
          </Link>
          <h1 className="text-lg font-bold text-white">Contacto</h1>
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
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4 mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground">Envíanos tu consulta</h1>
            <p className="text-lg text-muted-foreground">Completa el formulario y nos pondremos en contacto pronto</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 bg-muted/50 p-8 rounded-lg border border-border">
            {submitted && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                ¡Gracias por tu mensaje! Nos pondremos en contacto pronto a través de publicidad@dmsinnova.cl
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tu nombre"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Correo *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+56 9 XXXX XXXX"
                />
              </div>

              {/* Condominio */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Condominio (opcional)
                </label>
                <input
                  type="text"
                  name="condominio"
                  value={formData.condominio}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre de tu condominio"
                />
              </div>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tipo de mensaje *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="consulta">Consulta</option>
                <option value="sugerencia">Sugerencia</option>
                <option value="peticion">Petición de Funcionalidad</option>
                <option value="problema">Reporte de Problema</option>
              </select>
            </div>

            {/* Mensaje */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Mensaje *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Cuéntanos cómo podemos ayudarte..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : 'Enviar Mensaje'}
            </button>

            <p className="text-xs text-muted-foreground text-center">
              Tu mensaje será enviado a publicidad@dmsinnova.cl y nos pondremos en contacto pronto.
            </p>
          </form>
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
