import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 })
    }

    // Create admin client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    })

    // Test: Insert a test record to verify the table is working
    const testResult = await supabase
      .from("condominiums")
      .insert({
        name: "TEST",
        address: "TEST",
        currency: "CLP",
        currency_symbol: "$",
        currency_multiplier: 1,
        total_houses: 1,
        common_expense_amount: 0,
        payment_deadline_day: 5,
        created_by: "00000000-0000-0000-0000-000000000000",
      })
      .select()

    if (testResult.error) {
      console.error("[v0] Table test error:", testResult.error)
      return NextResponse.json(
        { error: `Table error: ${testResult.error.message}`, code: testResult.error.code },
        { status: 500 }
      )
    }

    // Clean up test record
    await supabase.from("condominiums").delete().eq("name", "TEST")

    return NextResponse.json({
      success: true,
      message: "Condominiums table is working correctly",
    })
  } catch (err) {
    console.error("[v0] API error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
