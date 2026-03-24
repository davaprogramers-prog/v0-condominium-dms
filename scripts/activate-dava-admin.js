import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("[v0] Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("[v0] Reactivating davaprogramers@gmail.com as admin...");

  // Find user by email using admin API
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error("[v0] Error listing users:", listError);
    return;
  }

  const davUser = users.users.find((u) => u.email === "davaprogramers@gmail.com");

  if (!davUser) {
    console.error("[v0] User davaprogramers@gmail.com not found");
    console.log("[v0] Available users:", users.users.map((u) => u.email));
    return;
  }

  console.log("[v0] Found user:", davUser.id, davUser.email);

  // Update user to enable it and set a new password
  const newPassword = "TempPassword123!@#";

  const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
    davUser.id,
    {
      password: newPassword,
      user_metadata: { activated: true },
    }
  );

  if (updateError) {
    console.error("[v0] Error updating user:", updateError);
    return;
  }

  console.log("[v0] User password reset and activated");

  // Get or create profile for this user
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, condo_id")
    .eq("id", davUser.id)
    .single();

  if (profileError) {
    console.error("[v0] Error fetching profile:", profileError);
    // Create profile if doesn't exist
    const { error: createError } = await supabase.from("profiles").insert({
      id: davUser.id,
      email: davUser.email,
      role: "admin",
      first_name: "Dava",
      last_name: "Programmers",
    });

    if (createError) {
      console.error("[v0] Error creating profile:", createError);
      return;
    }

    console.log("[v0] Profile created");
  } else {
    // Update existing profile to admin role
    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", davUser.id);

    if (updateProfileError) {
      console.error("[v0] Error updating profile role:", updateProfileError);
      return;
    }

    console.log("[v0] Profile role updated to admin");
  }

  // Get latest condominium and link it
  const { data: condo, error: condoError } = await supabase
    .from("condominiums")
    .select("id, name")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (condoError || !condo) {
    console.error("[v0] Error fetching condominium:", condoError);
    return;
  }

  console.log("[v0] Condominium found:", condo.id, condo.name);

  // Link user to condominium
  const { error: linkError } = await supabase
    .from("profiles")
    .update({ condo_id: condo.id })
    .eq("id", davUser.id);

  if (linkError) {
    console.error("[v0] Error linking to condominium:", linkError);
    return;
  }

  console.log("[v0] ✅ User davaprogramers@gmail.com is now activated as admin!");
  console.log("[v0] Email: davaprogramers@gmail.com");
  console.log("[v0] Temporary Password: " + newPassword);
  console.log("[v0] Condominium: " + condo.name);
}

main().catch(console.error);
