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

  // Create a temporary UUID for the concierge profile
  const tempId = crypto.randomUUID()

  // Use Supabase admin client to bypass RLS policies
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  )

  const { data: newProfile, error } = await adminSupabase
    .from("profiles")
    .insert({
      id: tempId,
      email: data.email,
      role: "conserje",
      condo_id: condoId,
      first_name: data.firstName,
      last_name: data.lastName
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creating concierge:", error)
    throw new Error(error.message || "Error al crear conserje")
  }

  return { success: true, profile: newProfile }
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
