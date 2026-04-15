import { createServiceClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")
  
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 })
  }

  try {
    const supabase = createServiceClient()
    
    // Get profile for this email
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single()
    
    return NextResponse.json({ 
      email,
      profile,
      error: error?.message 
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
