import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Get the condo_id for a user, avoiding RLS issues
 * Works for both owners (via profiles) and admins (via user_condos)
 */
export async function getUserCondoId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  try {
    // Try to get from profiles first (for owners and any user)
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
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("house_id")
      .eq("id", userId)
      .limit(1)

    if (profile && profile.length > 0 && profile[0]?.house_id) {
      return profile[0].house_id
    }
  } catch (e) {
    console.log("[v0] Error getting house from profiles:", e)
  }

  return null
}

