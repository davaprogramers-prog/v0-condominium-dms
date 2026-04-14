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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: cardTextColor }}>Mi Cuenta</h1>
        <p className="text-muted-foreground" style={{ color: cardTextColor }}>Administra tu información personal y seguridad</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Information */}
      <Card style={{ backgroundColor: cardBgColor || undefined }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: cardTextColor }}>
            <User className="h-5 w-5" />
            Información Personal
          </CardTitle>
          <CardDescription style={{ color: cardTextColor }}>
            Actualiza tu nombre y datos de contacto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" style={{ color: cardTextColor }}>Nombre</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={saving}
                  style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" style={{ color: cardTextColor }}>Apellido</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={saving}
                  style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" style={{ color: cardTextColor }}>Correo Electrónico</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={email}
                  disabled
                  style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
                />
              </div>
              <p className="text-xs text-muted-foreground" style={{ color: cardTextColor }}>
                El correo electrónico no puede ser modificado
              </p>
            </div>

            <div className="space-y-2">
              <Label style={{ color: cardTextColor }}>Rol</Label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                <span className="capitalize">{profile?.role || "Usuario"}</span>
              </div>
            </div>

            <Button type="submit" disabled={saving} className="w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card style={{ backgroundColor: cardBgColor || undefined }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: cardTextColor }}>
            <Key className="h-5 w-5" />
            Cambiar Contrasena
          </CardTitle>
          <CardDescription style={{ color: cardTextColor }}>
            Actualiza tu contraseña para mantener tu cuenta segura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" style={{ color: cardTextColor }}>Contraseña Actual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={savingPassword}
                  className="pr-10"
                  style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" style={{ color: cardTextColor }}>Nueva Contraseña</Label>
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={savingPassword}
                style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" style={{ color: cardTextColor }}>Confirmar Nueva Contraseña</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Repite tu nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={savingPassword}
                style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
              />
            </div>

            <Button type="submit" disabled={savingPassword} className="w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">
              {savingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Cambiar Contraseña
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
