"use server"

import { esSuperAdminEfectivo } from "@/lib/auth/plataforma/guardia"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { DEFAULT_RESET_PASSWORD } from "./constants"
import { MENSAJE_ACCION_BLOQUEADA, esUsuarioDemo } from "@/lib/demo/reglas"
import { autorizarAdminDeCondominio } from "@/lib/auth/condominio"

// Roles que un administrador puede dar desde el panel; super_admin solo se otorga en /plataforma.
const ROLES_CREABLES = new Set(["admin", "conserje", "propietario", "arrendatario"])
const ROLES_RESETEABLES_POR_ADMIN = new Set(["conserje", "propietario", "arrendatario", "owner", "concierge"])

interface CreateUserParams {
  email: string
  password: string
  firstName: string
  lastName: string
  role: string
  condoId: string
  houseId: string | null
  isOwner: boolean
}

export async function createUserWithRole(params: CreateUserParams) {
  try {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
      return { success: false, error: "No autenticado" }
    }
    if (esUsuarioDemo(currentUser)) return { success: false, error: MENSAJE_ACCION_BLOQUEADA }

    if (!ROLES_CREABLES.has(params.role)) {
      return { success: false, error: "Rol no válido" }
    }

    // El condominio se valida contra el perfil del administrador (leído en la BD), nunca se confía en el cliente.
    const { data: currentProfile } = await createAdminClient()
      .from("profiles")
      .select("condo_id")
      .eq("id", currentUser.id)
      .maybeSingle()
    const condoId = params.condoId || currentProfile?.condo_id
    const acceso = await autorizarAdminDeCondominio(condoId)
    if (!acceso.ok) {
      return { success: false, error: acceso.error === "No autenticado" ? acceso.error : "No tienes permisos para crear usuarios en este condominio" }
    }

    const adminClient = createAdminClient()

    if (params.houseId) {
      const { data: casa } = await adminClient.from("houses").select("id").eq("id", params.houseId).eq("condo_id", acceso.condoId).maybeSingle()
      if (!casa) return { success: false, error: "La casa no pertenece a este condominio" }
    }

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true,
      app_metadata: { role: params.role },
    })

    if (authError || !authData.user) {
      console.error("Auth error creating user:", authError)
      // Un correo existente es una cuenta ajena: nunca se le asigna rol ni condominio desde aquí.
      if (authError?.code === "email_exists") {
        return { success: false, error: "Este usuario ya existe. Por favor usa un correo diferente." }
      }
      return {
        success: false,
        error: authError?.message || "Error al crear usuario en autenticación"
      }
    }

    // Create profile using admin client
    const { error: profileError } = await adminClient
      .from("profiles")
      .insert({
        id: authData.user.id,
        email: params.email,
        first_name: params.firstName,
        last_name: params.lastName,
        role: params.role,
        condo_id: acceso.condoId,
      })

    if (profileError) {
      console.error("[v0] Error creating profile:", profileError)
      // Delete the auth user since profile creation failed
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return { success: false, error: "Error al crear perfil de usuario" }
    }

    // Assign house if needed
    if ((params.role === "propietario" || params.isOwner) && params.houseId) {
      const { error: houseError } = await adminClient
        .from("house_owners")
        .insert({
          house_id: params.houseId,
          user_id: authData.user.id,
        })

      if (houseError) {
        console.error("[v0] Error assigning house:", houseError)
        // Don't fail the entire operation if house assignment fails
      }
    }

    return { success: true }
  } catch (err) {
    console.error("Error creating user:", err)
    return { success: false, error: "Error inesperado al crear el usuario" }
  }
}

export async function updateUser(userId: string, data: any) {
  try {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
      return { error: "No autenticado" }
    }

    // Verify current user is super_admin
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single()

    if (!currentProfile || !(currentProfile.role === "super_admin" && (await esSuperAdminEfectivo()))) {
      return { error: "No tienes permisos para editar usuarios" }
    }

    // Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role,
        condo_id: data.condo_id,
      })
      .eq("id", userId)

    if (profileError) {
      return { error: "Error al actualizar perfil" }
    }

    // Update or create house assignment if needed
    if (data.is_owner && data.house_id) {
      // First check if assignment exists
      const { data: existing } = await supabase
        .from("house_owners")
        .select("id")
        .eq("user_id", userId)
        .single()

      if (existing) {
        // Update existing
        await supabase
          .from("house_owners")
          .update({ house_id: data.house_id })
          .eq("user_id", userId)
      } else {
        // Create new
        await supabase
          .from("house_owners")
          .insert({
            house_id: data.house_id,
            user_id: userId,
          })
      }
    } else if (!data.is_owner) {
      // Remove house assignment if no longer owner
      await supabase
        .from("house_owners")
        .delete()
        .eq("user_id", userId)
    }

    return { success: true }
  } catch (err) {
    console.error("Error updating user:", err)
    return { error: "Error inesperado al actualizar el usuario" }
  }
}

export async function resetUserPassword(userId: string) {
  try {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
      return { success: false, error: "No autenticado" }
    }
    if (esUsuarioDemo(currentUser)) return { success: false, error: MENSAJE_ACCION_BLOQUEADA }

    const adminClient = createAdminClient()
    const sinPermiso = { success: false, error: "No tienes permisos para resetear la contraseña de este usuario" }

    // Antes cualquier admin podía resetear la clave de CUALQUIER cuenta (incluido un super admin): toma de cuentas.
    const [{ data: objetivo }, { data: registroGlobal }] = await Promise.all([
      adminClient.from("profiles").select("role, condo_id").eq("id", userId).maybeSingle(),
      adminClient.from("platform_super_admins").select("user_id").eq("user_id", userId).maybeSingle(),
    ])
    if (!objetivo || registroGlobal || objetivo.role === "super_admin" || userId === currentUser.id) return sinPermiso

    const acceso = await autorizarAdminDeCondominio(objetivo.condo_id)
    if (!acceso.ok) return sinPermiso
    // Un administrador de condominio no puede tomar la cuenta de otro administrador.
    if (!acceso.esSuperAdmin && !ROLES_RESETEABLES_POR_ADMIN.has(objetivo.role)) return sinPermiso

    const { error } = await adminClient.auth.admin.updateUserById(userId, {
      password: DEFAULT_RESET_PASSWORD,
    })

    if (error) {
      console.error("[v0] Error resetting password:", error)
      return { success: false, error: "Error al resetear la contraseña: " + error.message }
    }

    return { success: true, password: DEFAULT_RESET_PASSWORD }
  } catch (err) {
    console.error("Error resetting password:", err)
    return { success: false, error: "Error inesperado al resetear la contraseña" }
  }
}

export async function deleteUser(userId: string) {
  try {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
      return { error: "No autenticado" }
    }

    // Verify current user is super_admin
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single()

    if (!currentProfile || !(currentProfile.role === "super_admin" && (await esSuperAdminEfectivo()))) {
      return { error: "No tienes permisos para eliminar usuarios" }
    }

    // Don't allow deleting super_admins
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()

    if (targetProfile?.role === "super_admin") {
      return { error: "No puedes eliminar a otro super administrador" }
    }

    // Delete from auth
    await supabase.auth.admin.deleteUser(userId)

    // Delete profile (should cascade delete related records)
    await supabase
      .from("profiles")
      .delete()
      .eq("id", userId)

    return { success: true }
  } catch (err) {
    console.error("Error deleting user:", err)
    return { error: "Error inesperado al eliminar el usuario" }
  }
}
