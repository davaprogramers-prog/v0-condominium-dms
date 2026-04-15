import { createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email")
    
    if (!email) {
      return NextResponse.json({ error: "Email parameter required" }, { status: 400 })
    }

    const supabase = createServiceClient()
    
    // Get all houses for this email grouped by condo
    const { data: houses, error } = await supabase
      .from("houses")
      .select("id, house_number, condo_id, condominiums(id, name)")
      .eq("owner_email", email)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by condo_id
    const groupedByCondos = houses?.reduce((acc: any, house: any) => {
      const condoId = house.condo_id
      if (!acc[condoId]) {
        acc[condoId] = {
          condoId,
          condoName: house.condominiums?.name,
          properties: []
        }
      }
      acc[condoId].properties.push({
        id: house.id,
        house_number: house.house_number
      })
      return acc
    }, {})

    return NextResponse.json({
      email,
      totalHouses: houses?.length || 0,
      condominiumsCount: Object.keys(groupedByCondos || {}).length,
      byCondominium: Object.values(groupedByCondos || {})
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
