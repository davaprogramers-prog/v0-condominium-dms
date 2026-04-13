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

  // Use Supabase Admin client
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  )

  // Step 1: Check if profile already exists for this email in this condo
  const { data: existingProfile } = await adminSupabase
    .from("profiles")
    .select("id, role, condo_id")
    .eq("email", data.email)
    .single()

  if (existingProfile) {
    // Profile exists
    if (existingProfile.condo_id === condoId && existingProfile.role === "conserje") {
      // Already assigned to this condo as conserje - This is OK, just return success
      // (idempotent operation)
      console.log(`[v0] Conserje ${data.email} ya estaba asignado a este condominio`)
      return { success: true, profile: existingProfile, alreadyExists: true }
    } else if (existingProfile.condo_id !== condoId) {
      // Profile exists but for a different condo - REASSIGN it
      console.log(`[v0] Reasignando conserje ${data.email} del condominio ${existingProfile.condo_id} al ${condoId}`)
      
      const { data: updatedProfile, error: updateError } = await adminSupabase
        .from("profiles")
        .update({
          condo_id: condoId,
          role: "conserje",
          first_name: data.firstName,
          last_name: data.lastName
        })
        .eq("id", existingProfile.id)
        .select()
        .single()

      if (updateError) {
        console.error("[v0] Error updating profile condo:", updateError)
        throw new Error("Error al asignar conserje al condominio")
      }

      return { success: true, profile: updatedProfile, wasReassigned: true }
    }
  }

  // Step 2: Check if auth user exists with this email
  const { data: authUsers, error: listError } = await adminSupabase.auth.admin.listUsers({
    perPage: 1000
  })

  const existingAuthUser = authUsers?.users?.find(u => u.email === data.email)

  if (existingAuthUser) {
    // Auth user exists, create/update profile for this condo
    console.log(`[v0] Usuario auth existe: ${existingAuthUser.id}`)

    const { data: profileData, error: profileError } = await adminSupabase
      .from("profiles")
      .upsert({
        id: existingAuthUser.id,
        email: data.email,
        role: "conserje",
        condo_id: condoId,
        first_name: data.firstName,
        last_name: data.lastName
      }, { onConflict: "id" })
      .select()
      .single()

    if (profileError) {
      console.error("[v0] Error upserting profile:", profileError)
      throw new Error(profileError.message || "Error al crear perfil del conserje")
    }

    return { success: true, profile: profileData }
  }

  // Step 3: Create new auth user
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      first_name: data.firstName,
      last_name: data.lastName
    }
  })

  if (authError) {
    console.error("[v0] Error creating auth user:", authError)
    throw new Error(authError.message || "Error al crear usuario de autenticación")
  }

  if (!authData.user?.id) {
    throw new Error("No se generó ID de usuario")
  }

  // Step 4: Create profile for new auth user
  const { data: profileData, error: profileError } = await adminSupabase
    .from("profiles")
    .insert({
      id: authData.user.id,
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
    // Delete auth user if profile creation failed
    await adminSupabase.auth.admin.deleteUser(authData.user.id).catch(() => {})
    throw new Error(profileError.message || "Error al crear perfil del conserje")
  }

  return { success: true, profile: profileData }
}

export async function getConcierges(condoId: string) {
  // Use service role to bypass RLS and get all conserjes for this condo
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  )

  const { data, error } = await adminSupabase
    .from("profiles")
    .select("*")
    .eq("condo_id", condoId)
    .eq("role", "conserje")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error getting concierges:", error)
    return []
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

  // Use admin client to delete the auth user and profile
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  )

  // Get the profile first to verify it belongs to this condo
  const { data: profileData } = await adminSupabase
    .from("profiles")
    .select("id, condo_id, email")
    .eq("id", profileId)
    .single()

  if (!profileData || profileData.condo_id !== condoId) {
    throw new Error("Conserje no encontrado o no pertenece a este condominio")
  }

  // Delete profile
  const { error: profileError } = await adminSupabase
    .from("profiles")
    .delete()
    .eq("id", profileId)

  if (profileError) {
    console.error("[v0] Error deleting profile:", profileError)
    throw new Error(profileError.message)
  }

  // Delete auth user
  const { error: authError } = await adminSupabase.auth.admin.deleteUser(profileId)
  
  if (authError) {
    console.error("[v0] Error deleting auth user:", authError)
    // Don't throw error here - profile is already deleted, just log it
  }

  return { success: true }
}
