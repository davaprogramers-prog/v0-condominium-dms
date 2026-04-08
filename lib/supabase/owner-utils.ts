import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Get the condo_id for a user, avoiding RLS issues
 * Works for both owners (via houses) and admins (via user_condos)
 */
export async function getUserCondoId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  // Try to get from houses first (for owners)
  const { data: house } = await supabase
    .from("houses")
    .select("condo_id")
    .eq("owner_id", userId)
    .limit(1)
    .single()

  if (house?.condo_id) {
    return house.condo_id
  }

  // Try to get from user_condos (for admin/super_admin)
  const { data: userCondos } = await supabase
    .from("user_condos")
    .select("condo_id")
    .eq("user_id", userId)
    .limit(1)
    .single()

  if (userCondos?.condo_id) {
    return userCondos.condo_id
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
