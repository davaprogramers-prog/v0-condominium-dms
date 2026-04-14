'use server'

import { createServiceClient } from "@/lib/supabase/server"

/**
 * Admin recovery function to assign a condominium to an existing user
 * This helps users who are stuck without a condominio assignment
 */
export async function assignCondoToUser(
  userId: string,
  email: string,
  condoId: string,
  houseId?: string
) {
  const supabase = createServiceClient()

  try {
    // Verify user exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (profileError || !profile) {
      throw new Error("Usuario no encontrado")
    }

    // If houseId provided, verify it belongs to the condo
    let targetHouseId = houseId
    if (houseId) {
      const { data: house, error: houseError } = await supabase
        .from("houses")
        .select("id, condo_id")
        .eq("id", houseId)
        .eq("condo_id", condoId)
        .single()

      if (houseError || !house) {
        throw new Error("Casa no pertenece a este condominio")
      }
      targetHouseId = house.id
    } else {
      // Get first house from the condo
      const { data: houses, error: housesError } = await supabase
        .from("houses")
        .select("id")
        .eq("condo_id", condoId)
        .limit(1)

      if (housesError || !houses?.length) {
        throw new Error("No hay casas en este condominio")
      }
      targetHouseId = houses[0].id
    }

    // Update profile with condo and house
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        condo_id: condoId,
        house_id: targetHouseId,
      })
      .eq("id", userId)

    if (updateError) throw updateError

    console.log("[v0] User assigned to condominio:", { userId, email, condoId, houseId: targetHouseId })
    return { success: true }
  } catch (err) {
    console.error("[v0] Error assigning condo to user:", err)
    throw err
  }
}
