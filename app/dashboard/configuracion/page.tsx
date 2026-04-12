import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LogoutButton } from "./logout-button"
import { ParametersForm } from "./parameters-form"
import { CondoLogoUploader } from "./condo-logo-uploader"
import { ThemeCustomizerWrapper } from "./theme-customizer-wrapper"
import { type CondoTheme, getContrastTextColor, DEFAULT_THEME } from "@/lib/theme-utils"

export default async function ConfiguracionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, condo_id, first_name, last_name")
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
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Administra tu perfil y condominio</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Mi Perfil */}
        <div 
          className="rounded-lg border p-6 space-y-4"
          style={{
            backgroundColor: cardBgColor,
            color: cardTextColor,
            borderColor: cardBgColor
          }}
        >
          <h2 className="text-xl font-semibold" style={{ color: cardTextColor }}>Mi Perfil</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p style={{ color: cardTextColor, opacity: 0.7 }}>Nombre</p>
              <p className="font-medium" style={{ color: cardTextColor }}>{profile?.first_name} {profile?.last_name}</p>
            </div>
            <div>
              <p style={{ color: cardTextColor, opacity: 0.7 }}>Email</p>
              <p className="font-medium text-xs" style={{ color: cardTextColor }}>{user.email}</p>
            </div>
            <div>
              <p style={{ color: cardTextColor, opacity: 0.7 }}>Rol</p>
              <p className="font-medium capitalize" style={{ color: cardTextColor }}>{profile?.role?.replace("_", " ")}</p>
            </div>
          </div>
        </div>

        {/* Condominio */}
        <div 
          className="rounded-lg border p-6 space-y-4"
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
      </div>

      {/* Logo del Condominio - Solo Admin */}
      {isAdmin && condo && (
        <CondoLogoUploader 
          condoId={condo.id} 
          currentLogoUrl={condo.logo_url}
        />
      )}

      {/* Parámetros del Condominio - Solo Admin */}
      {isAdmin && (
        <ParametersForm 
          condoId={profile?.condo_id} 
          currentParams={parameters}
        />
      )}

      {/* Personalización de Colores - Solo Admin */}
      {isAdmin && condo && (
        <ThemeCustomizerWrapper 
          condoId={condo.id} 
          currentTheme={theme as CondoTheme | null}
          isAdmin={isAdmin}
        />
      )}

      {/* Sesión */}
      <div className="rounded-lg border-2 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-red-100">Cerrar Sesión</h2>
            <p className="text-sm text-slate-700 dark:text-red-300">Termina tu sesión actual</p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
