import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("[v0] Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixMissingProfiles() {
  try {
    console.log("[v0] Starting profile fix...")

    // Get Condominio Test ID
    const { data: condos, error: condoError } = await supabase
      .from("condominiums")
      .select("id")
      .eq("name", "Condominio Test")
      .single()

    if (condoError || !condos) {
      console.error("[v0] Error finding condominio:", condoError)
      return
    }

    console.log("[v0] Found Condominio Test with ID:", condos.id)

    // Get the auth user for test1@administracioncondominio.app
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error("[v0] Error listing users:", usersError)
      return
    }

    const testUser = users.find(u => u.email === "test1@administracioncondominio.app")

    if (!testUser) {
      console.error("[v0] User test1@administracioncondominio.app not found in auth")
      return
    }

    console.log("[v0] Found auth user with ID:", testUser.id)

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", testUser.id)
      .single()

    if (existingProfile) {
      console.log("[v0] Profile already exists, skipping...")
      return
    }

    // Create the profile
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: testUser.id,
        email: testUser.email,
        first_name: "DMS",
        last_name: "Mora Ahumada",
        role: "admin",
        condo_id: condos.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error("[v0] Error creating profile:", insertError)
      return
    }

    console.log("[v0] Profile created successfully for", testUser.email)
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
  }
}

fixMissingProfiles()
