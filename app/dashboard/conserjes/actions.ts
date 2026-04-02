"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function createConcierge(condoId: string, data: {
  email: string
  password: string
  firstName: string
  lastName: string
}) {
  const supabase = await createClient()

  // Verify user is admin of this condo
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role, condo_id")
    .eq("id", user.id)
    .single()

  if (adminProfile?.role !== "admin" && adminProfile?.role !== "super_admin") {
    throw new Error("Solo administradores pueden crear conserjes")
  }

  if (adminProfile?.condo_id !== condoId) {
    throw new Error("No autorizado para este condominio")
  }

  // Use Supabase Admin client to create auth user
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  )

  // Step 1: Create auth user first (this will generate the ID)
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true, // Auto-confirm the email
    user_metadata: {
      first_name: data.firstName,
      last_name: data.lastName
    }
  })

  if (authError) {
    // Check if user already exists
    if (authError.message?.includes("already exists")) {
      // Try to find the existing user by email to get their ID
      const { data: existingUsers } = await adminSupabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users.find(u => u.email === data.email)
      
      if (existingUser) {
        // Check if profile already exists
        const { data: existingProfile } = await adminSupabase
          .from("profiles")
          .select("*")
          .eq("id", existingUser.id)
          .eq("condo_id", condoId)
          .single()

        if (existingProfile) {
          throw new Error(`El conserje ${data.firstName} ${data.lastName} ya existe en el condominio`)
        }

        // Profile doesn't exist yet, create it with the existing user ID
        const { data: profileData, error: profileError } = await adminSupabase
          .from("profiles")
          .insert({
            id: existingUser.id,
            email: data.email,
            role: "conserje",
            condo_id: condoId,
            first_name: data.firstName,
            last_name: data.lastName
          })
          .select()
          .single()

        if (profileError) {
          console.error("[v0] Error creating profile for existing user:", profileError)
          throw new Error(profileError.message || "Error al crear perfil del conserje")
        }

        return { success: true, profile: profileData }
      }
    }

    console.error("[v0] Error creating auth user:", authError)
    throw new Error(authError.message || "Error al crear usuario de autenticación")
  }

  if (!authData.user?.id) {
    throw new Error("No se generó ID de usuario")
  }

  // Step 2: Now create the profile with the auth user ID
  const { data: profileData, error: profileError } = await adminSupabase
    .from("profiles")
    .insert({
      id: authData.user.id, // Use the ID from auth user
      email: data.email,
      role: "conserje",
      condo_id: condoId,
      first_name: data.firstName,
      last_name: data.lastName
    })
    .select()
    .single()

  if (profileError) {
    console.error("[v0] Error creating profile:", profileError)
    // Check if this is a duplicate key error
    if (profileError.code === "23505") {
      throw new Error(`El conserje ${data.firstName} ${data.lastName} ya existe`)
    }
    // Try to delete the auth user if profile creation failed
    await adminSupabase.auth.admin.deleteUser(authData.user.id).catch(() => {})
    throw new Error(profileError.message || "Error al crear perfil del conserje")
  }

  return { success: true, profile: profileData }
}

export async function getConcierges(condoId: string) {
  const supabase = await createClient()

  // Verify user is admin of this condo
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role, condo_id")
    .eq("id", user.id)
    .single()

  if (adminProfile?.condo_id !== condoId) {
    throw new Error("No autorizado para este condominio")
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("condo_id", condoId)
    .eq("role", "conserje")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching concierges:", error)
    throw new Error(error.message)
  }

  return data || []
}

export async function updateConcierge(condoId: string, profileId: string, data: {
  firstName?: string
  lastName?: string
}) {
  const supabase = await createClient()

  // Verify user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role, condo_id")
    .eq("id", user.id)
    .single()

  if (adminProfile?.condo_id !== condoId) {
    throw new Error("No autorizado")
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: data.firstName,
      last_name: data.lastName
    })
    .eq("id", profileId)
    .eq("condo_id", condoId)

  if (error) {
    console.error("[v0] Error updating concierge:", error)
    throw new Error(error.message)
  }

  return { success: true }
}

export async function deleteConcierge(condoId: string, profileId: string) {
  const supabase = await createClient()

  // Verify user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role, condo_id")
    .eq("id", user.id)
    .single()

  if (adminProfile?.condo_id !== condoId) {
    throw new Error("No autorizado")
  }

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", profileId)
    .eq("condo_id", condoId)

  if (error) {
    console.error("[v0] Error deleting concierge:", error)
    throw new Error(error.message)
  }

  return { success: true }
}
