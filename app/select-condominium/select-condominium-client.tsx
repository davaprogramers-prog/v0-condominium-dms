'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CondominiumWithProperties } from '@/lib/supabase/owner-utils'

interface CondominiumTheme {
  id: string
  condo_id: string
  enable_custom_theme: boolean
  sidebar_bg_color: string
  main_bg_color: string
  card_bg_color: string
  sidebar_text_color: string
  main_text_color: string
  card_text_color: string
}

interface SelectCondominiumClientProps {
  condominiums: CondominiumWithProperties[]
  themes: Map<string, CondominiumTheme>
}

// Generate avatar initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('')
}

// Get contrasting text color based on background
function getContrastColor(bgColor: string): string {
  const hex = bgColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 155 ? '#000000' : '#ffffff'
}

export default function SelectCondominiumClient({
  condominiums,
  themes
}: SelectCondominiumClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [selectedCondo, setSelectedCondo] = useState<string | null>(null)
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSelectCondo = (condoId: string) => {
    setSelectedCondo(condoId)
    setSelectedProperty(null)
  }

  const handleSelectProperty = async (propertyId: string) => {
    if (!selectedCondo) return
    
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      // Update user profile with selected condo and property
      const { error } = await supabase
        .from('profiles')
        .update({
          condo_id: selectedCondo,
          house_id: propertyId
        })
        .eq('id', user.id)

      if (error) throw error

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('[v0] Error selecting condominium:', error)
      setLoading(false)
    }
  }

  const currentCondo = selectedCondo 
    ? condominiums.find(c => c.id === selectedCondo)
    : null

  if (!selectedCondo) {
    // Condominium Selection (Netflix-style grid)
    const gridColsClass = 
      condominiums.length === 1 ? 'justify-items-center' :
      condominiums.length === 2 ? 'lg:grid-cols-2 justify-center' :
      condominiums.length === 3 ? 'lg:grid-cols-3' :
      'lg:grid-cols-4'

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 py-12">
        <div className="w-full max-w-7xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-white mb-3">¿A cuál condominio deseas ingresar?</h1>
            <p className="text-slate-400 text-lg">Selecciona uno de tus condominios para continuar</p>
          </div>

          {/* Condominiums Grid - Centered */}
          <div className="flex justify-center">
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-8 w-full`}>
              {condominiums.map((condo) => {
                const theme = themes.get(condo.id)
                const bgColor = theme?.sidebar_bg_color || '#1e293b'
                const textColor = getContrastColor(bgColor)
                const initials = getInitials(condo.name)

                return (
                  <button
                    key={condo.id}
                    onClick={() => handleSelectCondo(condo.id)}
                    className="group relative h-72 rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 shadow-xl hover:shadow-2xl"
                    style={{
                      backgroundColor: bgColor,
                      borderColor: textColor + '33',
                      borderWidth: '1px'
                    }}
                  >
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 group-hover:to-black/70 transition-all" />
                    
                    {/* Content centered */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                      {/* Logo/Avatar Circle */}
                      <div 
                        className="mb-6 w-24 h-24 rounded-full flex items-center justify-center ring-2 ring-offset-2 transition-transform group-hover:scale-110"
                        style={{
                          backgroundColor: textColor === '#000000' ? '#e2e8f0' : '#1e293b',
                          ringColor: textColor,
                          color: textColor === '#000000' ? '#1e293b' : '#e2e8f0'
                        }}
                      >
                        <span className="text-4xl font-bold">{initials}</span>
                      </div>

                      {/* Condominium Name */}
                      <h2 
                        className="text-3xl font-bold mb-2 group-hover:scale-105 transition-transform"
                        style={{ color: textColor }}
                      >
                        {condo.name}
                      </h2>

                      {/* Properties count */}
                      <p 
                        className="text-sm mb-6 opacity-75 group-hover:opacity-100 transition-opacity"
                        style={{ color: textColor }}
                      >
                        {condo.properties.length} propiedad{condo.properties.length !== 1 ? 'es' : ''}
                      </p>

                      {/* Select Button */}
                      <button
                        className="mt-auto px-6 py-2 rounded-lg font-semibold transition-all opacity-0 group-hover:opacity-100 ring-2"
                        style={{
                          backgroundColor: textColor === '#000000' ? '#3b82f6' : '#60a5fa',
                          color: '#ffffff',
                          ringColor: textColor
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectCondo(condo.id)
                        }}
                      >
                        Seleccionar
                      </button>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Property Selection
  if (!currentCondo) return null

  const gridColsClass = 
    currentCondo.properties.length === 1 ? 'justify-items-center' :
    currentCondo.properties.length === 2 ? 'lg:grid-cols-2 justify-center' :
    currentCondo.properties.length === 3 ? 'lg:grid-cols-3' :
    'lg:grid-cols-4'

  const theme = themes.get(currentCondo.id)
  const bgColor = theme?.sidebar_bg_color || '#1e293b'
  const textColor = getContrastColor(bgColor)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-7xl">
        {/* Back Button */}
        <button
          onClick={() => setSelectedCondo(null)}
          className="mb-8 text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2 mx-auto text-lg"
        >
          ← Volver a condominios
        </button>

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-2">{currentCondo.name}</h1>
          <p className="text-slate-400 text-lg">Selecciona una propiedad para ingresar</p>
        </div>

        {/* Properties Grid - Centered */}
        <div className="flex justify-center">
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-8 w-full`}>
            {currentCondo.properties.map((property) => (
              <button
                key={property.id}
                onClick={() => handleSelectProperty(property.id)}
                disabled={loading}
                className="group relative h-72 rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-green-500 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  backgroundColor: bgColor,
                  borderColor: textColor + '33',
                  borderWidth: '1px'
                }}
              >
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 group-hover:to-black/70 transition-all" />
                
                {/* Content centered */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  {/* Property Icon/Avatar */}
                  <div 
                    className="mb-6 w-24 h-24 rounded-full flex items-center justify-center ring-2 ring-offset-2 transition-transform group-hover:scale-110"
                    style={{
                      backgroundColor: textColor === '#000000' ? '#e2e8f0' : '#1e293b',
                      ringColor: textColor,
                      color: textColor === '#000000' ? '#1e293b' : '#e2e8f0'
                    }}
                  >
                    <span className="text-4xl font-bold">🏠</span>
                  </div>

                  {/* Property Number */}
                  <h2 
                    className="text-3xl font-bold mb-2 group-hover:scale-105 transition-transform"
                    style={{ color: textColor }}
                  >
                    Casa {property.house_number}
                  </h2>

                  {/* Condominium info */}
                  <p 
                    className="text-sm opacity-75 group-hover:opacity-100 transition-opacity"
                    style={{ color: textColor }}
                  >
                    {currentCondo.name}
                  </p>

                  {/* Enter Button */}
                  <button
                    className="mt-auto px-6 py-2 rounded-lg font-semibold transition-all opacity-0 group-hover:opacity-100 ring-2 disabled:opacity-50"
                    style={{
                      backgroundColor: textColor === '#000000' ? '#10b981' : '#34d399',
                      color: '#ffffff',
                      ringColor: textColor
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectProperty(property.id)
                    }}
                    disabled={loading}
                  >
                    {loading ? 'Ingresando...' : 'Ingresar'}
                  </button>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
