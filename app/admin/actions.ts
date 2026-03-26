"use server"

import { createClient } from "@/lib/supabase/server"
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
  
  // Create user in auth
  const { data: newUser, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        role: "admin",
      }
    }
  })

  if (authError) {
    console.error("[v0] Error creating auth user:", authError)
    return { success: false, error: authError.message }
  }

  if (!newUser.user) {
    return { success: false, error: "No se pudo crear el usuario" }
  }

  // Update profile with condo_id and role
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: newUser.user.id,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      role: "admin",
      condo_id: data.condoId || null,
    })

  if (profileError) {
    console.error("[v0] Error updating profile:", profileError)
    return { success: false, error: profileError.message }
  }

  revalidatePath("/admin")
  return { success: true }
}
