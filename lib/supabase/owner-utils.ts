import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Get the condo_id for a user, avoiding RLS issues
 * Works for both owners (via houses) and admins (via user_condos)
 */
export async function getUserCondoId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  try {
    // Try to get from houses first (for owners)
    const { data: houses } = await supabase
      .from("houses")
      .select("condo_id")
      .eq("owner_id", userId)
      .limit(1)

    if (houses && houses.length > 0 && houses[0]?.condo_id) {
      return houses[0].condo_id
    }
  } catch (e) {
    console.log("[v0] Error getting condo from houses:", e)
  }

  try {
    // Try to get from user_condos (for admin/super_admin)
    const { data: userCondos } = await supabase
      .from("user_condos")
      .select("condo_id")
      .eq("user_id", userId)
      .limit(1)

    if (userCondos && userCondos.length > 0 && userCondos[0]?.condo_id) {
      return userCondos[0].condo_id
    }
  } catch (e) {
    console.log("[v0] Error getting condo from user_condos:", e)
  }

  try {
    // Last fallback: try to get from profiles if available
    const { data: profile } = await supabase
      .from("profiles")
      .select("condo_id")
      .eq("id", userId)
      .limit(1)

    if (profile && profile.length > 0 && profile[0]?.condo_id) {
      return profile[0].condo_id
    }
  } catch (e) {
    console.log("[v0] Error getting condo from profiles:", e)
  }

  return null
}

/**
 * Get the house_id for an owner, avoiding RLS issues
 */
export async function getUserHouseId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data: house } = await supabase
    .from("houses")
    .select("id")
    .eq("owner_id", userId)
    .limit(1)
    .single()

  return house?.id || null
}
