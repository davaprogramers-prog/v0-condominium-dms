import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Get user's condo and verify they're admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("condo_id, role")
      .eq("id", user.id)
      .single()

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Create project using service role (has permissions to bypass RLS)
    const serviceSupabase = createServiceRoleClient()
    const { error } = await serviceSupabase
      .from("projects")
      .insert({
        condo_id: profile.condo_id,
        name: body.name,
        improvement_type: body.improvement_type || null,
        description: body.description || null,
        location_description: body.location_description || null,
        location_photo_url: body.location_photo_url || null,
        estimated_cost: body.estimated_cost || 0,
        start_date: body.start_date || null,
        created_by: user.id,
        status: "propuesto",
      })

    if (error) {
      console.error("Error creating project:", error)
      return NextResponse.json({ error: "Failed to create project" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
