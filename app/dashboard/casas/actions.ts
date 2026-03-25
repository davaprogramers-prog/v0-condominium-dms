"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createHouse(
  condoId: string,
  formData: {
    houseNumber: number
    ownerName: string
    ownerEmail: string
    ownerPhone: string
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

  const { error } = await supabase.from("houses").insert({
    condo_id: condoId,
    house_number: formData.houseNumber,
    owner_name: formData.ownerName,
    owner_email: formData.ownerEmail,
    owner_phone: formData.ownerPhone,
  })

  if (error) {
    console.error("[v0] Error creating house:", error)
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/casas")
  return { success: true }
}
