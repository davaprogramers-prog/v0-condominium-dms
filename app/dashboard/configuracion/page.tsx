'use client'

import { useTheme } from '../theme-context'
import { LogoutButton } from "./logout-button"
import { ParametersForm } from "./parameters-form"
import { CondoLogoUploader } from "./condo-logo-uploader"
import { ThemeCustomizerWrapper } from "./theme-customizer-wrapper"
import { type CondoTheme } from "@/lib/theme-utils"
import { ProfileSettingsForm } from "./profile-settings-form"
import { AvatarUploadSettings } from "./avatar-upload-settings"
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ConfiguracionPage() {
  const router = useRouter()
  const supabase = createClient()
  const { cardBgColor, cardTextColor } = useTheme()
  
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [condo, setCondo] = useState<any>(null)
  const [parameters, setParameters] = useState<any>(null)
  const [theme, setTheme] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        setUserEmail(user.email || '')

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileData) {
          setProfile(profileData)
          setIsAdmin(profileData.role === "admin" || profileData.role === "super_admin")

          const { data: condoData } = await supabase
            .from("condominiums")
            .select("*")
            .eq("id", profileData.condo_id)
            .single()

          if (condoData) setCondo(condoData)

          const { data: parametersData } = await supabase
            .from("parameters")
            .select("*")
            .eq("condo_id", profileData.condo_id)
            .single()

          if (parametersData) setParameters(parametersData)

          const { data: themeData } = await supabase
            .from("condominium_themes")
            .select("*")
            .eq("condo_id", profileData.condo_id)
            .single()

          if (themeData) setTheme(themeData)
        }
      } catch (error) {
        console.error("[v0] Error loading configuration:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p style={{ color: cardTextColor }}>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: cardTextColor }}>Mi Cuenta</h1>
        <p style={{ color: cardTextColor, opacity: 0.7 }}>Administra tu perfil y seguridad</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Avatar y Perfil */}
        <div 
          className="rounded-lg border-2 p-6 space-y-4 lg:col-span-1"
          style={{
            backgroundColor: cardBgColor,
            color: cardTextColor,
            borderColor: "rgba(255,255,255,0.1)"
          }}
        >
          <h2 className="text-lg font-semibold" style={{ color: cardTextColor }}>Foto de Perfil</h2>
          <AvatarUploadSettings 
            currentAvatarUrl={profile?.avatar_url}
            userName={`${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Usuario"}
            cardBgColor={cardBgColor}
            cardTextColor={cardTextColor}
          />
        </div>

        {/* Información Personal */}
        <div 
          className="rounded-lg border-2 p-6 space-y-4 lg:col-span-2"
          style={{
            backgroundColor: cardBgColor,
            color: cardTextColor,
            borderColor: "rgba(255,255,255,0.1)"
          }}
        >
          <h2 className="text-lg font-semibold" style={{ color: cardTextColor }}>Información Personal</h2>
          <ProfileSettingsForm 
            profile={profile}
            userEmail={userEmail}
            cardBgColor={cardBgColor}
            cardTextColor={cardTextColor}
          />
        </div>
      </div>

      {/* Admin-only sections */}
      {isAdmin && (
        <>
          {/* Condominio Info */}
          <div 
            className="rounded-lg border-2 p-6 space-y-4"
            style={{
              backgroundColor: cardBgColor,
              color: cardTextColor,
              borderColor: "rgba(255,255,255,0.1)"
            }}
          >
            <h2 className="text-xl font-semibold" style={{ color: cardTextColor }}>Condominio</h2>
            {condo ? (
              <div className="space-y-3 text-sm">
                <div>
                  <p style={{ color: cardTextColor, opacity: 0.7 }}>Nombre</p>
                  <p className="font-medium" style={{ color: cardTextColor }}>{condo.name}</p>
                </div>
                <div>
                  <p style={{ color: cardTextColor, opacity: 0.7 }}>Moneda</p>
                  <p className="font-medium" style={{ color: cardTextColor }}>{condo.currency_symbol}</p>
                </div>
                <div>
                  <p style={{ color: cardTextColor, opacity: 0.7 }}>Creado</p>
                  <p className="font-medium" style={{ color: cardTextColor }}>{new Date(condo.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ) : (
              <p style={{ color: cardTextColor, opacity: 0.7 }}>No tienes un condominio asociado</p>
            )}
          </div>

          {/* Logo del Condominio */}
          {condo && (
            <CondoLogoUploader 
              condoId={condo.id} 
              currentLogoUrl={condo.logo_url}
              cardBgColor={cardBgColor}
              cardTextColor={cardTextColor}
            />
          )}

          {/* Parámetros del Condominio */}
          {parameters && (
            <ParametersForm 
              condoId={profile?.condo_id} 
              currentParams={parameters}
              cardBgColor={cardBgColor}
              cardTextColor={cardTextColor}
            />
          )}

          {/* Personalización de Colores */}
          {condo && (
            <ThemeCustomizerWrapper 
              condoId={condo.id} 
              currentTheme={theme as CondoTheme | null}
              isAdmin={isAdmin}
              cardBgColor={cardBgColor}
              cardTextColor={cardTextColor}
            />
          )}
        </>
      )}

      {/* Sesión */}
      <div 
        className="rounded-lg border-2 p-6"
        style={{
          backgroundColor: cardBgColor,
          color: cardTextColor,
          borderColor: "rgba(255,255,255,0.1)"
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: cardTextColor }}>Cerrar Sesión</h2>
            <p className="text-sm" style={{ color: cardTextColor, opacity: 0.7 }}>Termina tu sesión actual</p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
