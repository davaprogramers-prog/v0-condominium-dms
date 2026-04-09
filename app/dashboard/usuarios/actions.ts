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

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
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
      // Delete the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return { success: false, error: "Error al crear perfil de usuario" }
    }

    // Assign house if provided
    if (params.houseId) {
      const { error: houseError } = await supabase
        .from("house_owners")
        .insert({
          house_id: params.houseId,
          user_id: authData.user.id,
        })

      if (houseError) {
        console.error("Error assigning house:", houseError)
        // Continue anyway - the user is created, just not assigned to a house
      }
    }

    return { success: true }
  } catch (err) {
    console.error("Error creating user:", err)
    return { success: false, error: "Error inesperado al crear el usuario" }
  }
}
