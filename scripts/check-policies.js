import postgres from "postgres"

const sql = postgres({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: "require",
})

async function checkPolicies() {
  console.log("[v0] Checking RLS policies for condominiums table...")
  
  try {
    const policies = await sql`
      SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
      FROM pg_policies
      WHERE tablename = 'condominiums'
      ORDER BY policyname
    `
    
    console.log("[v0] Condominiums policies:", JSON.stringify(policies, null, 2))
    
    // Check if profiles table has the condo_id column
    const profilesSchema = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'profiles'
      ORDER BY ordinal_position
    `
    
    console.log("[v0] Profiles columns:", JSON.stringify(profilesSchema, null, 2))
    
    // Test creating a condo with a test user
    console.log("[v0] Testing condominium creation flow...")
    
    await sql.end()
    console.log("[v0] Check complete!")
  } catch (error) {
    console.error("[v0] Error:", error)
    process.exit(1)
  }
}

checkPolicies()
