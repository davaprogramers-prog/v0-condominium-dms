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
  
  // Use the API route which has service role access
  const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/create-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  const result = await response.json()
  
  if (!response.ok) {
    return { success: false, error: result.error }
  }

  revalidatePath("/dashboard/administradores")
  return { success: true }
}
