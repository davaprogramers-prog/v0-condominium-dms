import { esSuperAdminEfectivo } from "@/lib/auth/plataforma/guardia"
import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Get the condo_id for a user, avoiding RLS issues
 * Works for both owners (via profiles or via their house) and admins
 * For super_admin without condo_id, returns the first condominium
 */
export async function getUserCondoId(
  supabase: SupabaseClient,
  userId: string,
  userEmail?: string
): Promise<string | null> {
  void userEmail
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("condo_id, house_id, role")
      .eq("id", userId)
      .limit(1)

    const fila = profile?.[0]
    if (!fila) return null
    if (fila.condo_id) return fila.condo_id

    if (fila.house_id) {
      const { data: house } = await supabase.from("houses").select("condo_id").eq("id", fila.house_id).limit(1)
      if (house?.[0]?.condo_id) return house[0].condo_id
    }

    // Admin/super admin sin condo_id: primer condominio visible (RLS limita a los accesibles)
    if (fila.role === "admin" || (fila.role === "super_admin" && (await esSuperAdminEfectivo()))) {
      const { data: condos } = await supabase
        .from("condominiums")
        .select("id")
        .limit(1)
        .order("created_at", { ascending: true })
      if (condos?.[0]?.id) return condos[0].id
    }
  } catch (e) {
    console.error("[owner-utils] getUserCondoId:", (e as Error).message)
  }
  return null
}

/**
 * Get the house_id for an owner, avoiding RLS issues
 * Checks: profiles.house_id -> houses.owner_email -> house_owners.email
 */
export async function getUserHouseId(
  supabase: SupabaseClient,
  userId: string,
  userEmail?: string
): Promise<string | null> {
  try {
    // 1. First check profiles.house_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("house_id, email")
      .eq("id", userId)
      .limit(1)

    if (profile?.[0]?.house_id) return profile[0].house_id

    const email = userEmail || profile?.[0]?.email
    if (email) {
      const { data: houses } = await supabase.from("houses").select("id").eq("owner_email", email).limit(1)
      if (houses?.[0]?.id) return houses[0].id
    }
  } catch (e) {
    console.error("[owner-utils] getUserHouseId:", (e as Error).message)
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
  logo_url: string | null
  properties: CondominiumProperty[]
}

export async function getUserAllCondominiums(
  supabase: SupabaseClient,
  userEmail: string
): Promise<CondominiumWithProperties[]> {
  try {
    console.log("[v0] Getting all condominiums for user:", userEmail)
    
    // Query houses table directly by owner_email
    // The houses table has owner_email, owner_name, and condo_id
    const { data: houses, error: housesError } = await supabase
      .from("houses")
      .select("id, house_number, condo_id, condominiums(id, name, logo_url)")
      .eq("owner_email", userEmail)
    
    console.log("[v0] Houses query result:", { houses, housesError })
    
    if (housesError) {
      console.log("[v0] Error getting houses:", housesError)
      return []
    }
    
    if (!houses || houses.length === 0) {
      console.log("[v0] No houses found for owner email:", userEmail)
      return []
    }
    
    // Group properties by condominium
    const condominiumMap = new Map<string, CondominiumWithProperties>()
    
    houses.forEach((house: any) => {
      const condominiumId = house.condo_id
      const condominiumData = house.condominiums
      
      console.log("[v0] Processing house:", { id: house.id, number: house.house_number, condoId: condominiumId, condoData: condominiumData })
      
      if (!condominiumId || !condominiumData) {
        console.log("[v0] Skipping house - missing condo data")
        return
      }
      
      if (!condominiumMap.has(condominiumId)) {
        condominiumMap.set(condominiumId, {
          id: condominiumId,
          name: condominiumData.name || 'Condominio',
          logo_url: condominiumData.logo_url || null,
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
    console.log("[v0] Final user condominiums:", result)
    return result
  } catch (e) {
    console.log("[v0] Error getting all condominiums:", e)
    return []
  }
}

