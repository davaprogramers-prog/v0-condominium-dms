import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LogoutButton } from "./logout-button"
import { ParametersForm } from "./parameters-form"
import { CondoLogoUploader } from "./condo-logo-uploader"
import { ThemeCustomizerWrapper } from "./theme-customizer-wrapper"
import { type CondoTheme, getContrastTextColor, DEFAULT_THEME } from "@/lib/theme-utils"
import { ProfileSettingsForm } from "./profile-settings-form"
import { AvatarUploadSettings } from "./avatar-upload-settings"

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const { data: condo } = await supabase
    .from("condominiums")
    .select("*")
    .eq("id", profile?.condo_id)
    .single()

  const { data: parameters } = await supabase
    .from("parameters")
    .select("*")
    .eq("condo_id", profile?.condo_id)
    .single()

  const { data: theme } = await supabase
    .from("condominium_themes")
    .select("*")
    .eq("condo_id", profile?.condo_id)
    .single()

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"

  // Determine which colors to use - custom theme if enabled, otherwise defaults
  const cardBgColor = (theme as CondoTheme | null)?.enable_custom_theme ? (theme as CondoTheme).card_bg_color : DEFAULT_THEME.card_bg_color
  const cardTextColor = (theme as CondoTheme | null)?.enable_custom_theme ? (theme as CondoTheme).card_text_color : DEFAULT_THEME.card_text_color

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mi Cuenta</h1>
        <p className="text-muted-foreground">Administra tu perfil y seguridad</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Avatar y Perfil */}
        <div 
          className="rounded-lg border-2 p-6 space-y-4 lg:col-span-1"
          style={{
            backgroundColor: cardBgColor,
            color: cardTextColor,
            borderColor: cardBgColor
          }}
        >
          <h2 className="text-lg font-semibold" style={{ color: cardTextColor }}>Foto de Perfil</h2>
          <AvatarUploadSettings 
            currentAvatarUrl={profile?.avatar_url}
            userName={`${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Usuario"}
          />
        </div>

        {/* Información Personal */}
        <div 
          className="rounded-lg border-2 p-6 space-y-4 lg:col-span-2"
          style={{
            backgroundColor: cardBgColor,
            color: cardTextColor,
            borderColor: cardBgColor
          }}
        >
          <h2 className="text-lg font-semibold" style={{ color: cardTextColor }}>Información Personal</h2>
          <ProfileSettingsForm 
            profile={profile}
            userEmail={user.email}
          />
        </div>
      </div>

      {/* Cambiar Contraseña */}
      <div 
        className="rounded-lg border-2 p-6 space-y-4"
        style={{
          backgroundColor: cardBgColor,
          color: cardTextColor,
          borderColor: cardBgColor
        }}
      >
        <h2 className="text-lg font-semibold" style={{ color: cardTextColor }}>Seguridad</h2>
        <div className="space-y-2 text-sm" style={{ color: cardTextColor }}>
          <p style={{ opacity: 0.7 }}>Cambia tu contraseña para mantener tu cuenta segura</p>
          {/* Change password form will be in a client component */}
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
              borderColor: cardBgColor
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
            />
          )}

          {/* Parámetros del Condominio */}
          <ParametersForm 
            condoId={profile?.condo_id} 
            currentParams={parameters}
          />

          {/* Personalización de Colores */}
          {condo && (
            <ThemeCustomizerWrapper 
              condoId={condo.id} 
              currentTheme={theme as CondoTheme | null}
              isAdmin={isAdmin}
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
          borderColor: cardBgColor
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
