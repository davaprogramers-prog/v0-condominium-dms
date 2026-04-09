"use server"

import { createClient } from "@/lib/supabase/server"

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
    // Call the API endpoint that has access to service role
    const response = await fetch("/api/usuarios/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || "Error al crear usuario" }
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
