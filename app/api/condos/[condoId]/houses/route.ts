import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ condoId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { condoId } = await params

    const { data: houses, error } = await supabase
      .from("houses")
      .select("id, house_number")
      .eq("condo_id", condoId)
      .order("house_number", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(houses || [])
  } catch (err) {
    console.error("Error fetching houses:", err)
    return NextResponse.json({ error: "Error al obtener casas" }, { status: 500 })
  }
}
