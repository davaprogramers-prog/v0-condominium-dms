'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CondominiumWithProperties } from '@/lib/supabase/owner-utils'

interface SelectCondominiumClientProps {
  condominiums: CondominiumWithProperties[]
}

export default function SelectCondominiumClient({
  condominiums
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {!selectedCondo ? (
          // Condominium Selection (Netflix-style grid)
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">¿A cuál condominio deseas ingresar?</h1>
            <p className="text-slate-400 text-lg">Selecciona uno de tus condominios para continuar</p>
          </div>
        ) : (
          // Property Selection
          <div className="text-center mb-12">
            <button
              onClick={() => setSelectedCondo(null)}
              className="mb-6 text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2 mx-auto"
            >
              ← Volver a condominios
            </button>
            <h1 className="text-4xl font-bold text-white mb-2">{currentCondo?.name}</h1>
            <p className="text-slate-400 text-lg">Selecciona una propiedad</p>
          </div>
        )}

        {!selectedCondo ? (
          // Condominium Grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {condominiums.map((condo) => (
              <button
                key={condo.id}
                onClick={() => handleSelectCondo(condo.id)}
                className="group relative h-64 rounded-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 hover:border-blue-500"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 group-hover:to-black/95 transition-all" />
                
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                  <div className="mb-3">
                    <h2 className="text-2xl font-bold mb-2">{condo.name}</h2>
                    <p className="text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      {condo.properties.length} propiedad{condo.properties.length !== 1 ? 'es' : ''}
                    </p>
                  </div>
                  
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectCondo(condo.id)
                    }}
                  >
                    Seleccionar
                  </button>
                </div>
              </button>
            ))}
          </div>
        ) : (
          // Properties Grid
          currentCondo && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentCondo.properties.map((property) => (
                <button
                  key={property.id}
                  onClick={() => handleSelectProperty(property.id)}
                  disabled={loading}
                  className="group relative h-64 rounded-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 group-hover:to-black/95 transition-all" />
                  
                  <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                    <div className="mb-3">
                      <h2 className="text-3xl font-bold mb-2">Casa {property.house_number}</h2>
                      <p className="text-sm text-slate-300">
                        {currentCondo.name}
                      </p>
                    </div>
                    
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectProperty(property.id)
                      }}
                      disabled={loading}
                    >
                      {loading ? 'Cargando...' : 'Ingresar'}
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
