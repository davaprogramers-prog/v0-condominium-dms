import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify super_admin role
  if (user?.user_metadata?.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data: condos, error } = await supabase
      .from("condominiums")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json(condos || [])
  } catch (error) {
    console.error("[v0] Error fetching condos:", error)
    return NextResponse.json(
      { error: "Error al cargar condominios" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify super_admin role
  if (user?.user_metadata?.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name, country, city } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: "El nombre del condominio es requerido" },
        { status: 400 }
      )
    }

    const { data: condo, error } = await supabase
      .from("condominiums")
      .insert([{ name, country, city, created_by: user?.id }])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(condo)
  } catch (error) {
    console.error("[v0] Error creating condo:", error)
    return NextResponse.json(
      { error: "Error al crear condominio" },
      { status: 500 }
    )
  }
}
