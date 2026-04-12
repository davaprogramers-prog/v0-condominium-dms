"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

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

    // Verify current user is admin or super_admin
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role, condo_id")
      .eq("id", currentUser.id)
      .single()

    if (!currentProfile || !["admin", "super_admin"].includes(currentProfile.role)) {
      return { success: false, error: "No tienes permisos para crear usuarios" }
    }

    const condoId = params.condoId || currentProfile.condo_id

    if (!condoId) {
      return { success: false, error: "Condominio no especificado" }
    }

    // Create auth user using ADMIN client with service role key
    const adminClient = createAdminClient()
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      console.error("[v0] Auth error creating user:", authError)
      return { 
        success: false, 
        error: authError?.message || "Error al crear usuario en autenticación" 
      }
    }

    // Create profile
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        email: params.email,
        first_name: params.firstName,
        last_name: params.lastName,
        role: params.role,
        condo_id: condoId,
      })

    if (profileError) {
      console.error("Error creating profile:", profileError)
      await supabase.auth.admin.deleteUser(authData.user.id)
      return { success: false, error: "Error al crear perfil de usuario" }
    }

    // Assign house if needed
    if ((params.role === "propietario" || params.isOwner) && params.houseId) {
      const { error: houseError } = await supabase
        .from("house_owners")
        .insert({
          house_id: params.houseId,
          user_id: authData.user.id,
        })

      if (houseError) {
        console.error("Error assigning house:", houseError)
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

    if (!currentProfile || currentProfile.role !== "super_admin") {
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

    if (!currentProfile || currentProfile.role !== "super_admin") {
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
