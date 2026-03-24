import postgres from "postgres";

const databaseUrl = process.env.POSTGRES_URL;
const sql = postgres(databaseUrl, { ssl: "require" });

const tables = await sql`
  SELECT tablename FROM pg_tables 
  WHERE schemaname = 'public' 
  ORDER BY tablename
`;

console.log("Tables in public schema:");
for (const t of tables) {
  console.log("  - " + t.tablename);
}

const policies = await sql`
  SELECT tablename, policyname FROM pg_policies 
  WHERE schemaname = 'public' 
  ORDER BY tablename, policyname
`;

console.log("\nRLS policies:");
for (const p of policies) {
  console.log("  " + p.tablename + ": " + p.policyname);
}

const triggers = await sql`
  SELECT trigger_name, event_object_table 
  FROM information_schema.triggers 
  WHERE trigger_schema = 'public' OR event_object_schema = 'auth'
`;

console.log("\nTriggers:");
for (const t of triggers) {
  console.log("  " + t.event_object_table + ": " + t.trigger_name);
}

await sql.end();
