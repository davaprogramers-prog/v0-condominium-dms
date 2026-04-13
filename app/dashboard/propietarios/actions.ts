"use server"

import { createClient } from "@/lib/supabase/server"

export async function createHouse(data: {
  condo_id: string
  house_number: string
  owner_name: string
  owner_email: string
}) {
  const supabase = await createClient()

  // Verify user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, condo_id")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    throw new Error("No autorizado")
  }

  if (profile?.condo_id !== data.condo_id) {
    throw new Error("No autorizado para este condominio")
  }

  // Create the house
  const { error } = await supabase
    .from("houses")
    .insert({
      condo_id: data.condo_id,
      house_number: data.house_number,
      owner_name: data.owner_name,
      owner_email: data.owner_email,
    })

  if (error) {
    console.error("[v0] Error creating house:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
