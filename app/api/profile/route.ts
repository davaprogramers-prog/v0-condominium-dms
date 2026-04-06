import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Try to get profile - if it fails, return a default profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      // Return a minimal profile if not found
      // This allows users without proper profile setup to still access
      return NextResponse.json({
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || "propietario",
        condo_id: null,
        house_id: null,
        first_name: user.user_metadata?.first_name || "Usuario",
        last_name: user.user_metadata?.last_name || "Sin Apellido",
        avatar_url: null,
        needs_setup: true,
      })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("[v0] Error in /api/profile:", error)
    return NextResponse.json({ error: "Error al obtener perfil" }, { status: 500 })
  }
}
