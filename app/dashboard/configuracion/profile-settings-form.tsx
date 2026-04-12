"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react"

interface ProfileSettingsFormProps {
  profile: any
  userEmail?: string
}

export function ProfileSettingsForm({ profile, userEmail }: ProfileSettingsFormProps) {
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const supabase = createClient()

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "")
      setLastName(profile.last_name || "")
    }
  }, [profile])

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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error("No se pudo verificar el usuario")

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (signInError) {
        throw new Error("La contraseña actual es incorrecta")
      }

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

  return (
    <div className="space-y-6">
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

      {/* Profile Information Form */}
      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Nombre</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={saving}
              className="bg-slate-700 text-white border-slate-600"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Apellido</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={saving}
              className="bg-slate-700 text-white border-slate-600"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo Electrónico</Label>
          <Input
            id="email"
            value={userEmail || ""}
            disabled
            className="bg-slate-700 text-white border-slate-600 opacity-75"
          />
          <p className="text-xs opacity-75">
            El correo electrónico no puede ser modificado
          </p>
        </div>

        {profile?.role && (
          <div className="space-y-2">
            <Label>Rol</Label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-slate-700 text-white border border-slate-600">
              <span className="capitalize">{profile.role}</span>
            </div>
          </div>
        )}

        <Button 
          type="submit" 
          disabled={saving} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Guardar Cambios
        </Button>
      </form>

      {/* Change Password Form */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold mb-4">Cambiar Contraseña</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Contraseña Actual</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={savingPassword}
                className="bg-slate-700 text-white border-slate-600 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva Contraseña</Label>
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={savingPassword}
              className="bg-slate-700 text-white border-slate-600"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Repite tu nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={savingPassword}
              className="bg-slate-700 text-white border-slate-600"
            />
          </div>

          <Button 
            type="submit" 
            disabled={savingPassword} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {savingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Cambiar Contraseña
          </Button>
        </form>
      </div>
    </div>
  )
}
