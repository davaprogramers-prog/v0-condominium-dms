"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createHouse(
  condoId: string,
  formData: {
    houseNumber: number
    ownerName: string
    ownerEmail: string
    ownerPhone?: string
  }
) {
  const supabase = await createClient()
  
  // Verify user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No authenticated")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, condo_id")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin" || profile?.condo_id !== condoId) {
    throw new Error("No tienes permisos para crear casas")
  }

  // Insert house with only existing columns
  const { data: house, error: houseError } = await supabase
    .from("houses")
    .insert({
      condo_id: condoId,
      house_number: formData.houseNumber,
      owner_name: formData.ownerName,
      owner_email: formData.ownerEmail,
    })
    .select()
    .single()

  if (houseError) {
    console.error("[v0] Error creating house:", houseError)
    throw new Error(houseError.message)
  }

  revalidatePath("/dashboard/casas")
  return { success: true }
}

export async function updateHouse(
  houseId: string,
  formData: {
    ownerName: string
    ownerEmail: string
    ownerPhone?: string
  }
) {
  const supabase = await createClient()
  
  // Verify user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No authenticated")

  const { data: house } = await supabase
    .from("houses")
    .select("condo_id")
    .eq("id", houseId)
    .single()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, condo_id")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin" || profile?.condo_id !== house?.condo_id) {
    throw new Error("No tienes permisos para editar casas")
  }

  // Update house with only existing columns
  const { error: houseError } = await supabase
    .from("houses")
    .update({
      owner_name: formData.ownerName,
      owner_email: formData.ownerEmail,
    })
    .eq("id", houseId)

  if (houseError) {
    console.error("[v0] Error updating house:", houseError)
    throw new Error(houseError.message)
  }

  revalidatePath("/dashboard/casas")
  return { success: true }
}

