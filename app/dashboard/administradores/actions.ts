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
  
  // Delete from profiles table
  const { error: profileError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId)

  if (profileError) {
    console.error("[v0] Error deleting profile:", profileError)
    return { success: false, error: profileError.message }
  }
  
  revalidatePath("/admin")
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
    // User exists - just update their profile to make them admin
    userId = existingUser.id
    
    // Update user metadata
    await supabaseAdmin.auth.admin.updateUserById(userId, {
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
