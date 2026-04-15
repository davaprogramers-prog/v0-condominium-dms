import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Get the condo_id for a user, avoiding RLS issues
 * Works for both owners (via profiles or via their house) and admins
 */
export async function getUserCondoId(
  supabase: SupabaseClient,
  userId: string,
  userEmail?: string
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
      
      // If no profile but we have email, try searching via house_owners table
      if (userEmail) {
        console.log("[v0] Searching house_owners by email:", userEmail)
        const { data: houseOwners, error: hoError } = await supabase
          .from("house_owners")
          .select("house_id, houses(condo_id)")
          .eq("email", userEmail)
          .limit(1)
        
        console.log("[v0] House owners query result:", { houseOwners, hoError })
        
        if (houseOwners && houseOwners.length > 0 && houseOwners[0]?.houses) {
          const houses = houseOwners[0].houses as any
          if (houses?.condo_id) {
            console.log("[v0] Found condo_id via house_owners:", houses.condo_id)
            return houses.condo_id
          }
        }
      }
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
  userId: string,
  userEmail?: string
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

    // If no profile house_id but we have email, try searching via house_owners table
    if (userEmail) {
      console.log("[v0] Searching house_owners by email for house_id:", userEmail)
      const { data: houseOwners } = await supabase
        .from("house_owners")
        .select("house_id")
        .eq("email", userEmail)
        .limit(1)
      
      if (houseOwners && houseOwners.length > 0 && houseOwners[0]?.house_id) {
        console.log("[v0] Found house_id via house_owners:", houseOwners[0].house_id)
        return houseOwners[0].house_id
      }
    }
  } catch (e) {
    console.log("[v0] Error getting house from profiles:", e)
  }

  return null
}

/**
 * Get all condominiums for a user (multi-property support)
 * Returns array of condominiums with their properties for the user
 */
export interface CondominiumProperty {
  id: string
  house_number: string | number
  condo_id: string
}

export interface CondominiumWithProperties {
  id: string
  name: string
  properties: CondominiumProperty[]
}

export async function getUserAllCondominiums(
  supabase: SupabaseClient,
  userEmail: string
): Promise<CondominiumWithProperties[]> {
  try {
    console.log("[v0] Getting all condominiums for user:", userEmail)
    
    // Get all houses owned by this user via house_owners table
    const { data: houseOwners, error: hoError } = await supabase
      .from("house_owners")
      .select("house_id, houses(id, house_number, condo_id, condominiums(id, name))")
      .eq("email", userEmail)
    
    console.log("[v0] House owners query result:", { houseOwners, hoError })
    
    if (hoError) {
      console.log("[v0] Error getting house owners:", hoError)
      return []
    }
    
    if (!houseOwners || houseOwners.length === 0) {
      console.log("[v0] No house owners found for email:", userEmail)
      return []
    }
    
    // Group properties by condominium
    const condominiumMap = new Map<string, CondominiumWithProperties>()
    
    houseOwners.forEach((owner: any) => {
      const house = owner.houses
      if (!house) return
      
      const condominiumId = house.condo_id
      const condominiumData = house.condominiums
      
      if (!condominiumId || !condominiumData) return
      
      if (!condominiumMap.has(condominiumId)) {
        condominiumMap.set(condominiumId, {
          id: condominiumId,
          name: condominiumData.name || 'Condominio',
          properties: []
        })
      }
      
      const condo = condominiumMap.get(condominiumId)!
      condo.properties.push({
        id: house.id,
        house_number: house.house_number,
        condo_id: condominiumId
      })
    })
    
    const result = Array.from(condominiumMap.values())
    console.log("[v0] User condominiums:", result)
    return result
  } catch (e) {
    console.log("[v0] Error getting all condominiums:", e)
    return []
  }
}

