import type { Metadata, Viewport } from 'next'
import './globals.css'
import { RegistrarServiceWorker } from '@/components/pwa/registrar-service-worker'

const SITIO_URL = 'https://www.administracioncondominio.app'
const TITULO = 'InteliCon - Gestión de condominios'
const DESCRIPCION = 'Plataforma para administrar gastos, ingresos, encuestas, documentos y proyectos de tu condominio.'

export const metadata: Metadata = {
  metadataBase: new URL(SITIO_URL),
  title: TITULO,
  description: DESCRIPCION,
  applicationName: 'InteliCon',
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'InteliCon',
    locale: 'es_CL',
    title: TITULO,
    description: DESCRIPCION,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Logo de InteliCon' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITULO,
    description: DESCRIPCION,
    images: ['/og-image.png'],
  },
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
