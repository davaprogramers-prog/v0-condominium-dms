import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("[v0] Fetching admin user from auth...");
  
  // Get admin user from auth.users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError || !authUsers) {
    console.error("[v0] Could not fetch auth users:", authError);
    return;
  }

  console.log("[v0] Total auth users:", authUsers.users.length);

  // Find admin@condoapp.com
  const adminAuthUser = authUsers.users.find(u => u.email === "admin@condoapp.com");
  
  if (!adminAuthUser) {
    console.error("[v0] Could not find admin@condoapp.com in auth");
    console.log("[v0] Available users:", authUsers.users.map(u => u.email));
    return;
  }

  console.log("[v0] Admin auth user found:", adminAuthUser.id, adminAuthUser.email);

  // Get profile for this admin
  const { data: adminProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, condo_id")
    .eq("id", adminAuthUser.id)
    .single();

  if (profileError || !adminProfile) {
    console.error("[v0] Could not find admin profile:", profileError);
    return;
  }

  console.log("[v0] Admin profile found:", adminProfile.id, "Role:", adminProfile.role, "Current condo_id:", adminProfile.condo_id);

  // Get latest condominium
  const { data: condo, error: condoError } = await supabase
    .from("condominiums")
    .select("id, name")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (condoError || !condo) {
    console.error("[v0] Could not find condominium:", condoError);
    return;
  }

  console.log("[v0] Condominium found:", condo.id, condo.name);

  // Link admin to condominium if not already linked
  if (adminProfile.condo_id === condo.id) {
    console.log("[v0] Admin is already linked to this condominium!");
    return;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ condo_id: condo.id })
    .eq("id", adminAuthUser.id);

  if (updateError) {
    console.error("[v0] Could not update profile:", updateError);
    return;
  }

  console.log("[v0] Admin linked to condominium successfully!");
  console.log("[v0] Admin ID:", adminAuthUser.id);
  console.log("[v0] Condo ID:", condo.id);
}

main().catch(console.error);
