import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Get the condo_id for a user, avoiding RLS issues
 * Works for both owners (via profiles or via their house) and admins
 */
export async function getUserCondoId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  try {
    // Try to get from profiles first (for owners and any user)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("condo_id, house_id")
      .eq("id", userId)
      .limit(1)

    console.log("[v0] getUserCondoId - profile query result:", { profile, profileError })

    if (profile && profile.length > 0) {
      if (profile[0]?.condo_id) {
        console.log("[v0] Found condo_id in profile:", profile[0].condo_id)
        return profile[0].condo_id
      }
      
      // If no condo_id but has house_id, get condo_id from the house
      if (profile[0]?.house_id) {
        console.log("[v0] Profile has house_id:", profile[0].house_id, "- querying houses table")
        const { data: house, error: houseError } = await supabase
          .from("houses")
          .select("condo_id")
          .eq("id", profile[0].house_id)
          .limit(1)
        
        console.log("[v0] House query result:", { house, houseError })
        
        if (house && house.length > 0 && house[0]?.condo_id) {
          console.log("[v0] Found condo_id via house:", house[0].condo_id)
          return house[0].condo_id
        }
      } else {
        console.log("[v0] Profile has no house_id:", profile[0])
      }
    } else {
      console.log("[v0] No profile found for user:", userId)
    }
  } catch (e) {
    console.log("[v0] Error getting condo:", e)
  }

  console.log("[v0] getUserCondoId returning null for user:", userId)
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

