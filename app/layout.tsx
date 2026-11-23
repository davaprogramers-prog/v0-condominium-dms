import type { Metadata, Viewport } from 'next'
import './globals.css'
import { RegistrarServiceWorker } from '@/components/pwa/registrar-service-worker'

export const metadata: Metadata = {
  title: 'InteliCon - Gestión de condominios',
  description: 'Plataforma para administrar gastos, ingresos, encuestas, documentos y proyectos de tu condominio.',
  applicationName: 'InteliCon',
  appleWebApp: { capable: true, title: 'InteliCon', statusBarStyle: 'default' },
  icons: {
    icon: [{ url: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/apple-icon.png', sizes: '180x180' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#0d3068',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="bg-background">
      <body>
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  )
}
