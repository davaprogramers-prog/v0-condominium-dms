"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { DEFAULT_RESET_PASSWORD } from "./constants"

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
      
      // If email already exists, try to get the existing user and create profile
      if (authError?.code === 'email_exists') {
        console.log("[v0] Email already exists, attempting to create profile for existing user")
        const existingUser = await adminClient.auth.admin.getUserById(params.email)
        
        if (existingUser.data?.user) {
          // Try to create profile for existing user
          const { error: profileError } = await adminClient
            .from("profiles")
            .insert({
              id: existingUser.data.user.id,
              first_name: params.firstName,
              last_name: params.lastName,
              role: params.role,
              condo_id: condoId,
            })
            .select()
          
          if (profileError && !profileError.message.includes('duplicate key')) {
            console.error("[v0] Error creating profile for existing user:", profileError)
            return { 
              success: false, 
              error: "Este usuario ya existe. Por favor usa un correo diferente." 
            }
          }
          
          return { success: true }
        }
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
        first_name: params.firstName,
        last_name: params.lastName,
        role: params.role,
        condo_id: condoId,
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

export async function resetUserPassword(userId: string) {
  try {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
      return { success: false, error: "No autenticado" }
    }

    // Verify current user is admin or super_admin
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single()

    if (!currentProfile || !["admin", "super_admin"].includes(currentProfile.role)) {
      return { success: false, error: "No tienes permisos para resetear contraseñas" }
    }

    // Reset the password using the admin client (service role bypasses the encrypted stored password)
    const adminClient = createAdminClient()
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
