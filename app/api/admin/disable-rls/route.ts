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

    // List of tables to disable RLS on
    const tables = [
      "projects",
      "project_quotes",
      "exemptions",
      "exemption_types",
      "condominiums",
      "profiles",
      "condo_income",
      "condo_expenses",
      "expense_types",
      "infractions",
      "bank_statements",
      "houses",
      "house_owners",
      "documents",
      "surveys",
      "survey_responses",
      "material_requests",
      "alerts",
      "rentals",
      "areas_comunes",
      "visitas",
      "cartolas",
    ]

    const results = []
    
    for (const table of tables) {
      try {
        // Execute raw SQL to disable RLS
        const { data, error } = await supabase.rpc("exec", {
          sql: `ALTER TABLE public."${table}" DISABLE ROW LEVEL SECURITY;`,
        })

        if (error && error.code !== "42704") { // 42704 is "does not exist"
          results.push({ table, status: "error", message: error.message })
        } else {
          results.push({ table, status: "disabled" })
        }
      } catch (err) {
        results.push({ 
          table, 
          status: "error", 
          message: err instanceof Error ? err.message : "Unknown error" 
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "RLS disable operation completed",
      results,
    })
  } catch (err) {
    console.error("[v0] API error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
