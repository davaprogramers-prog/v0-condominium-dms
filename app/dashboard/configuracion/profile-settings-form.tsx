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
  cardBgColor?: string
  cardTextColor?: string
}

export function ProfileSettingsForm({ profile, userEmail, cardBgColor = "#1e293b", cardTextColor = "#f1f5f9" }: ProfileSettingsFormProps) {
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
        <div 
          className="border px-4 py-3 rounded flex items-center gap-2"
          style={{
            backgroundColor: "#065f46",
            borderColor: "#10b981",
            color: "#d1fae5"
          }}
        >
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div 
          className="border px-4 py-3 rounded flex items-center gap-2"
          style={{
            backgroundColor: "#7f1d1d",
            borderColor: "#dc2626",
            color: "#fecaca"
          }}
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Information Form */}
      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" style={{ color: cardTextColor }}>Nombre</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={saving}
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                color: cardTextColor,
                borderColor: "rgba(255,255,255,0.2)",
                borderRadius: "8px"
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" style={{ color: cardTextColor }}>Apellido</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={saving}
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                color: cardTextColor,
                borderColor: "rgba(255,255,255,0.2)",
                borderRadius: "8px"
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" style={{ color: cardTextColor }}>Correo Electrónico</Label>
          <Input
            id="email"
            value={userEmail || ""}
            disabled
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              color: cardTextColor,
              borderColor: "rgba(255,255,255,0.2)",
              borderRadius: "8px",
              opacity: 0.7
            }}
          />
          <p style={{ fontSize: "12px", color: cardTextColor, opacity: 0.6 }}>
            El correo electrónico no puede ser modificado
          </p>
        </div>

        {profile?.role && (
          <div className="space-y-2">
            <Label style={{ color: cardTextColor }}>Rol</Label>
            <div 
              className="flex items-center gap-2 px-3 py-2 rounded-md border capitalize"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                color: cardTextColor,
                borderColor: "rgba(255,255,255,0.2)",
                borderRadius: "8px"
              }}
            >
              <span>{profile.role}</span>
            </div>
          </div>
        )}

        <Button 
          type="submit" 
          disabled={saving}
          style={{
            backgroundColor: "#2563eb",
            color: "white",
            width: "100%",
            borderRadius: "8px",
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1
          }}
        >
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Guardar Cambios
        </Button>
      </form>

      {/* Change Password Form */}
      <div 
        className="border-t pt-6"
        style={{
          borderColor: "rgba(255,255,255,0.1)",
          color: cardTextColor
        }}
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: cardTextColor }}>Cambiar Contraseña</h3>
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
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: cardTextColor,
                  borderColor: "rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  paddingRight: "40px"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: cardTextColor,
                  opacity: 0.5,
                  cursor: "pointer",
                  background: "none",
                  border: "none"
                }}
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
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                color: cardTextColor,
                borderColor: "rgba(255,255,255,0.2)",
                borderRadius: "8px"
              }}
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
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                color: cardTextColor,
                borderColor: "rgba(255,255,255,0.2)",
                borderRadius: "8px"
              }}
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
