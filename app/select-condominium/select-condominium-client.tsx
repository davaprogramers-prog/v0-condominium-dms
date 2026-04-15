'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { CondominiumWithProperties } from '@/lib/supabase/owner-utils'
import { getContrastTextColor } from '@/lib/theme-utils'

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

export default function SelectCondominiumClient({
  condominiums,
  themes
}: SelectCondominiumClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [selectedCondo, setSelectedCondo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSelectCondo = (condoId: string) => {
    setSelectedCondo(condoId)
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
    // Condominium Selection Grid
    const itemCount = condominiums.length
    const isSingle = itemCount === 1
    const isDouble = itemCount === 2
    const gridCols = isSingle ? 'grid-cols-1' : isDouble ? 'grid-cols-2' : itemCount === 3 ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    const maxWidth = isSingle || isDouble ? 'max-w-2xl' : isDouble ? 'max-w-4xl' : 'max-w-6xl'

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 py-12">
        <div className={`w-full ${maxWidth} mx-auto`}>
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">¿A cuál condominio deseas ingresar?</h1>
            <p className="text-slate-400 text-lg">Selecciona uno de tus condominios para continuar</p>
          </div>

          {/* Condominiums Grid - Centered */}
          <div className={`grid ${gridCols} gap-8 justify-center`}>
            {condominiums.map((condo) => {
              const theme = themes.get(condo.id)
              const bgColor = theme?.card_bg_color || '#1e293b'
              const textColor = theme?.card_text_color || getContrastTextColor(bgColor)

              return (
                <button
                  key={condo.id}
                  onClick={() => handleSelectCondo(condo.id)}
                  className="group relative rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xl hover:shadow-2xl h-80"
                  style={{
                    backgroundColor: bgColor
                  }}
                >
                  {/* Overlay gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 group-hover:to-black/60 transition-all" />
                  
                  {/* Content centered */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
                    {/* Logo - Circular container */}
                    <div 
                      className="rounded-full flex items-center justify-center overflow-hidden mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0"
                      style={{
                        width: '120px',
                        height: '120px',
                        backgroundColor: theme?.main_bg_color || '#0f172a'
                      }}
                    >
                      {condo.logo_url ? (
                        <Image
                          src={condo.logo_url}
                          alt={condo.name}
                          width={120}
                          height={120}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-4xl">🏢</span>
                      )}
                    </div>

                    {/* Condominium Name */}
                    <h2 
                      className="text-2xl md:text-3xl font-bold group-hover:scale-105 transition-transform"
                      style={{ color: textColor }}
                    >
                      {condo.name}
                    </h2>

                    {/* Properties count */}
                    <p 
                      className="text-sm opacity-75 group-hover:opacity-100 transition-opacity"
                      style={{ color: textColor }}
                    >
                      {condo.properties.length} propiedad{condo.properties.length !== 1 ? 'es' : ''}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Property Selection
  if (!currentCondo) return null

  const theme = themes.get(currentCondo.id)
  const bgColor = theme?.card_bg_color || '#1e293b'
  const textColor = theme?.card_text_color || getContrastTextColor(bgColor)
  const itemCount = currentCondo.properties.length
  const isSingle = itemCount === 1
  const isDouble = itemCount === 2
  const gridCols = isSingle ? 'grid-cols-1' : isDouble ? 'grid-cols-2' : itemCount === 3 ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  const maxWidth = isSingle || isDouble ? 'max-w-2xl' : isDouble ? 'max-w-4xl' : 'max-w-6xl'

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 py-12">
      <div className={`w-full ${maxWidth} mx-auto`}>
        {/* Back Button */}
        <button
          onClick={() => setSelectedCondo(null)}
          className="mb-8 text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2 mx-auto text-lg"
        >
          ← Volver a condominios
        </button>

        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* Back/Change Icon - More prominent */}
            <button
              onClick={() => setSelectedCondo(null)}
              className="p-3 hover:bg-blue-600 bg-blue-500 rounded-full transition-all hover:scale-110 group shadow-lg"
              title="Cambiar condominio"
            >
              <svg 
                className="w-7 h-7 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" 
                />
              </svg>
            </button>

            {/* Logo */}
            {currentCondo.logo_url && (
              <div 
                className="rounded-full overflow-hidden shadow-lg flex items-center justify-center flex-shrink-0"
                style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: theme?.main_bg_color || '#0f172a'
                }}
              >
                <Image
                  src={currentCondo.logo_url}
                  alt={currentCondo.name}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{currentCondo.name}</h1>
          <p className="text-slate-400 text-lg">Selecciona una propiedad para ingresar</p>
        </div>

        {/* Properties Grid - Centered */}
        <div className={`grid ${gridCols} gap-8 justify-center`}>
          {currentCondo.properties.map((property) => (
            <button
              key={property.id}
              onClick={() => handleSelectProperty(property.id)}
              disabled={loading}
              className="group relative rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 h-80"
              style={{
                backgroundColor: bgColor
              }}
            >
              {/* Overlay gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 group-hover:to-black/60 transition-all" />
              
              {/* Content centered */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
                {/* Property Icon */}
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center ring-2 transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: theme?.main_bg_color || '#0f172a',
                    color: textColor
                  }}
                >
                  <span className="text-4xl">🏠</span>
                </div>

                {/* Property Number */}
                <h2 
                  className="text-2xl md:text-3xl font-bold group-hover:scale-105 transition-transform"
                  style={{ color: textColor }}
                >
                  Casa {property.house_number}
                </h2>

                {/* Status text */}
                <p 
                  className="text-sm opacity-75 group-hover:opacity-100 transition-opacity"
                  style={{ color: textColor }}
                >
                  Lista para acceder
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
