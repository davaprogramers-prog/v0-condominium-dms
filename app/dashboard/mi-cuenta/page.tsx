"use client"

import { useState, useEffect } from "react"
import { useTheme } from "../theme-context"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { User, Mail, Key, Loader2, CheckCircle2, Eye, EyeOff, AlertCircle } from "lucide-react"

export default function MiCuentaPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  
  const [profile, setProfile] = useState<any>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const supabase = createClient()
  const { cardBgColor, cardTextColor, inputBgColor, inputTextColor } = useTheme()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileData) {
          setProfile(profileData)
          setFirstName(profileData.first_name || "")
          setLastName(profileData.last_name || "")
          setEmail(user.email || "")
        }
      } catch (err) {
        console.error("Error loading profile:", err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [supabase])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess("")
    setError("")

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No autenticado")

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
        })
        .eq("id", user.id)

      if (error) throw error

      setSuccess("Perfil actualizado correctamente")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      console.error("Error updating profile:", err)
      setError(err.message || "Error al actualizar perfil")
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    setSavingPassword(true)

    try {
      // First verify current password by trying to sign in
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error("No se pudo verificar el usuario")

      // Try to sign in with current password to verify it
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (signInError) {
        throw new Error("La contraseña actual es incorrecta")
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      setSuccess("Contraseña actualizada correctamente")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      console.error("Error changing password:", err)
      setError(err.message || "Error al cambiar la contraseña")
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full">
      <div className="w-full">
        <h1 className="text-2xl sm:text-3xl font-bold break-words" style={{ color: cardTextColor }}>Mi Cuenta</h1>
        <p className="text-sm sm:text-base text-muted-foreground break-words" style={{ color: cardTextColor }}>Administra tu información personal y seguridad</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded flex items-center gap-2 text-sm sm:text-base">
          <CheckCircle2 className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" />
          <span className="break-words">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded flex items-center gap-2 text-sm sm:text-base">
          <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}

      {/* Profile Information */}
      <Card style={{ backgroundColor: cardBgColor || undefined }}>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl break-words" style={{ color: cardTextColor }}>
            <User className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" />
            <span>Información Personal</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm break-words" style={{ color: cardTextColor }}>
            Actualiza tu nombre y datos de contacto
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <form onSubmit={handleUpdateProfile} className="space-y-3 sm:space-y-4 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 w-full">
              <div className="space-y-2 w-full min-w-0">
                <Label htmlFor="firstName" className="text-xs sm:text-sm" style={{ color: cardTextColor }}>Nombre</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={saving}
                  className="text-xs sm:text-sm w-full truncate"
                  style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
                />
              </div>
              <div className="space-y-2 w-full min-w-0">
                <Label htmlFor="lastName" className="text-xs sm:text-sm" style={{ color: cardTextColor }}>Apellido</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={saving}
                  className="text-xs sm:text-sm w-full truncate"
                  style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
                />
              </div>
            </div>

            <div className="space-y-2 w-full min-w-0">
              <Label htmlFor="email" className="text-xs sm:text-sm" style={{ color: cardTextColor }}>Correo Electrónico</Label>
              <div className="flex items-center gap-2 w-full min-w-0">
                <Mail className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  id="email"
                  value={email}
                  disabled
                  className="text-xs sm:text-sm w-full truncate"
                  style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
                />
              </div>
              <p className="text-xs text-muted-foreground break-words" style={{ color: cardTextColor }}>
                El correo electrónico no puede ser modificado
              </p>
            </div>

            <div className="space-y-2 w-full">
              <Label className="text-xs sm:text-sm" style={{ color: cardTextColor }}>Rol</Label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm break-words" style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                <span className="capitalize">{profile?.role || "Usuario"}</span>
              </div>
            </div>

            <Button type="submit" disabled={saving} className="w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white text-xs sm:text-sm py-2 sm:py-3">
              {saving && <Loader2 className="h-3 sm:h-4 w-3 sm:w-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card style={{ backgroundColor: cardBgColor || undefined }}>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl break-words" style={{ color: cardTextColor }}>
            <Key className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" />
            <span>Cambiar Contraseña</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm break-words" style={{ color: cardTextColor }}>
            Actualiza tu contraseña para mantener tu cuenta segura
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <form onSubmit={handleChangePassword} className="space-y-3 sm:space-y-4 w-full">
            <div className="space-y-2 w-full">
              <Label htmlFor="currentPassword" className="text-xs sm:text-sm" style={{ color: cardTextColor }}>Contraseña Actual</Label>
              <div className="relative w-full">
                <Input
                  id="currentPassword"
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={savingPassword}
                  className="pr-10 text-xs sm:text-sm w-full"
                  style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  {showPassword ? <EyeOff className="h-3 sm:h-4 w-3 sm:w-4" /> : <Eye className="h-3 sm:h-4 w-3 sm:w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2 w-full">
              <Label htmlFor="newPassword" className="text-xs sm:text-sm" style={{ color: cardTextColor }}>Nueva Contraseña</Label>
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={savingPassword}
                className="text-xs sm:text-sm w-full"
                style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
              />
            </div>

            <div className="space-y-2 w-full">
              <Label htmlFor="confirmPassword" className="text-xs sm:text-sm" style={{ color: cardTextColor }}>Confirmar Nueva Contraseña</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Repite tu nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={savingPassword}
                className="text-xs sm:text-sm w-full"
                style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
              />
            </div>

            <Button type="submit" disabled={savingPassword} className="w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white text-xs sm:text-sm py-2 sm:py-3">
              {savingPassword && <Loader2 className="h-3 sm:h-4 w-3 sm:w-4 mr-2 animate-spin" />}
              Cambiar Contraseña
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
