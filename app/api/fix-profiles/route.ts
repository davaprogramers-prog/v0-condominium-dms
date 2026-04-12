import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  // Security: Only allow if proper authorization header is present
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const adminClient = createAdminClient()

    // Get all profiles without condo_id but with house_id
    const { data: profilesWithoutCondo, error: fetchError } = await adminClient
      .from("profiles")
      .select("id, house_id")
      .is("condo_id", null)
      .not("house_id", "is", null)

    if (fetchError) {
      console.error("[v0] Error fetching profiles:", fetchError)
      return NextResponse.json({ error: "Error fetching profiles" }, { status: 500 })
    }

    console.log(`[v0] Found ${profilesWithoutCondo?.length || 0} profiles to fix`)

    if (!profilesWithoutCondo || profilesWithoutCondo.length === 0) {
      return NextResponse.json({ message: "No profiles need fixing", updated: 0 })
    }

    let updated = 0

    // For each profile, get the condo_id from the house and update
    for (const profile of profilesWithoutCondo) {
      // Get house details
      const { data: house, error: houseError } = await adminClient
        .from("houses")
        .select("condo_id")
        .eq("id", profile.house_id)
        .single()

      if (houseError || !house) {
        console.error(`[v0] Error getting house for profile ${profile.id}:`, houseError)
        continue
      }

      // Update profile with condo_id
      const { error: updateError } = await adminClient
        .from("profiles")
        .update({ condo_id: house.condo_id })
        .eq("id", profile.id)

      if (updateError) {
        console.error(`[v0] Error updating profile ${profile.id}:`, updateError)
        continue
      }

      updated++
      console.log(`[v0] Updated profile ${profile.id} with condo_id ${house.condo_id}`)
    }

    return NextResponse.json({
      message: "Profiles updated successfully",
      updated,
      total: profilesWithoutCondo.length,
    })
  } catch (error) {
    console.error("[v0] Error in fix-profiles endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
