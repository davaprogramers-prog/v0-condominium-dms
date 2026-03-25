const postgres = require("postgres");

const sql = postgres({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function fixRLS() {
  try {
    console.log("[v0] Fixing RLS policies for condominiums...");

    // Drop existing policies
    await sql`
      DROP POLICY IF EXISTS "condo_select" ON public.condominiums;
      DROP POLICY IF EXISTS "condo_insert" ON public.condominiums;
      DROP POLICY IF EXISTS "condo_update" ON public.condominiums;
      DROP POLICY IF EXISTS "condo_delete" ON public.condominiums;
    `;
    console.log("[v0] Dropped old policies");

    // Create new policies that allow admins to insert
    await sql`
      CREATE POLICY "condo_select" ON public.condominiums 
        FOR SELECT USING (true);
    `;
    console.log("[v0] Created condo_select policy");

    await sql`
      CREATE POLICY "condo_insert" ON public.condominiums 
        FOR INSERT 
        WITH CHECK (auth.uid() = created_by);
    `;
    console.log("[v0] Created condo_insert policy");

    await sql`
      CREATE POLICY "condo_update" ON public.condominiums 
        FOR UPDATE 
        USING (created_by = auth.uid());
    `;
    console.log("[v0] Created condo_update policy");

    await sql`
      CREATE POLICY "condo_delete" ON public.condominiums 
        FOR DELETE 
        USING (created_by = auth.uid());
    `;
    console.log("[v0] Created condo_delete policy");

    console.log("[v0] RLS policies fixed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("[v0] Error:", error);
    process.exit(1);
  }
}

fixRLS();
