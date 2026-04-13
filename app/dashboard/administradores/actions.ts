"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

export async function deleteAdmin(userId: string) {
  const supabase = await createClient()
  
  // Verify the current user is super_admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "No autenticado" }
  }
  
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  
  if (currentProfile?.role !== "super_admin") {
    return { success: false, error: "No tienes permisos para esta acción" }
  }

  try {
    // First, delete related records in condo_income table
    const { error: incomeError } = await supabase
      .from("condo_income")
      .delete()
      .eq("created_by", userId)

    if (incomeError) {
      console.error("[v0] Error deleting condo_income records:", incomeError)
      // Continue anyway as there might not be any records
    }

    // Delete from auth
    await supabase.auth.admin.deleteUser(userId)
  } catch (authError) {
    console.error("[v0] Error deleting from auth:", authError)
    // Continue to delete profile even if auth delete fails
  }

  // Delete from profiles table
  const { error: profileError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId)

  if (profileError) {
    console.error("[v0] Error deleting profile:", profileError)
    return { success: false, error: profileError.message }
  }
  
  revalidatePath("/dashboard/administradores")
  return { success: true }
}

export async function updateAdminThemePermission(adminId: string, canChangeTheme: boolean) {
  const supabase = await createClient()
  
  // Verify the current user is super_admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "No autenticado" }
  }
  
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  
  if (currentProfile?.role !== "super_admin") {
    return { success: false, error: "No tienes permisos para esta acción" }
  }
  
  // Update admin theme permission
  const { error } = await supabase
    .from("profiles")
    .update({ can_change_theme: canChangeTheme })
    .eq("id", adminId)

  if (error) {
    console.error("[v0] Error updating admin theme permission:", error)
    return { success: false, error: error.message }
  }
  
  revalidatePath("/dashboard/administradores")
  return { success: true }
}

export async function updateAdminHouse(adminId: string, houseId: string) {
  const supabase = await createClient()
  
  // Verify the current user is super_admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "No autenticado" }
  }
  
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  
  if (currentProfile?.role !== "super_admin") {
    return { success: false, error: "No tienes permisos para esta acción" }
  }

  // Get house details to ensure it exists and get condo_id
  const { data: house, error: houseError } = await supabase
    .from("houses")
    .select("id, condo_id")
    .eq("id", houseId)
    .single()

  if (houseError || !house) {
    return { success: false, error: "Propiedad no válida" }
  }

  // Use service role client to update (bypasses RLS)
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({
      house_id: houseId,
      condo_id: house.condo_id,
    })
    .eq("id", adminId)

  if (updateError) {
    console.error("[v0] Error updating admin house:", updateError)
    return { success: false, error: updateError.message }
  }

  revalidatePath("/dashboard/administradores")
  return { success: true }
}


export async function createAdmin(data: {
  email: string
  password: string
  firstName: string
  lastName: string
  condoId: string
}) {
  const supabase = await createClient()
  
  // Verify the current user is super_admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "No autenticado" }
  }
  
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  
  if (currentProfile?.role !== "super_admin") {
    return { success: false, error: "No tienes permisos para esta acción" }
  }
  
  // Use service role client for admin operations
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // First check if user already exists
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
  const existingUser = existingUsers?.users?.find(u => u.email === data.email)

  let userId: string

  if (existingUser) {
    // User exists - update their profile to make them admin and confirm email
    userId = existingUser.id
    
    // Update user metadata and confirm email
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true,
      user_metadata: {
        first_name: data.firstName,
        last_name: data.lastName,
        role: "admin",
      }
    })
  } else {
    // Create new user with admin API (bypasses rate limits and auto-confirms email)
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        first_name: data.firstName,
        last_name: data.lastName,
        role: "admin",
      }
    })

    if (authError) {
      console.error("[v0] Error creating auth user:", authError)
      return { success: false, error: authError.message }
    }

    if (!newUser.user) {
      return { success: false, error: "No se pudo crear el usuario" }
    }
    
    userId = newUser.user.id
  }

  // Update profile with condo_id and role (service role bypasses RLS)
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert({
      id: userId,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      role: "admin",
      condo_id: data.condoId || null,
    }, { onConflict: 'id' })

  if (profileError) {
    console.error("[v0] Profile upsert error:", profileError)
    // Try direct update instead
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        first_name: data.firstName,
        last_name: data.lastName,
        role: "admin",
        condo_id: data.condoId || null,
      })
      .eq("id", userId)
    
    if (updateError) {
      console.error("[v0] Profile update error:", updateError)
    }
  }

  revalidatePath("/dashboard/administradores")
  return { success: true }
}
