import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("[v0] Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Usuarios a crear: presidente, tesorero, secretario del condominio Canelo
const USERS_TO_CREATE = [
  {
    email: "presidente@administracioncondominio.app",
    password: "Pr3sidentecanelo",
    role: "admin",
    first_name: "Presidente",
    last_name: "Canelo",
  },
  {
    email: "tesorero@administracioncondominio.app",
    password: "T3soreCanelo",
    role: "admin",
    first_name: "Tesorero",
    last_name: "Canelo",
  },
  {
    email: "secretario@administracioncondominio.app",
    password: "S3cretarioCanelo",
    role: "admin",
    first_name: "Secretario",
    last_name: "Canelo",
  },
];

async function main() {
  try {
    console.log("[v0] Iniciando creación de perfiles de usuarios...\n");

    // Obtener el condominio "Canelo"
    const { data: condo, error: condoError } = await supabase
      .from("condominiums")
      .select("id, name")
      .ilike("name", "%canelo%")
      .single();

    if (condoError || !condo) {
      console.error("[v0] No se encontró el condominio Canelo:", condoError);
      console.log("[v0] Por favor, crea primero el condominio 'Canelo' en el dashboard");
      return;
    }

    console.log("[v0] Condominio encontrado:", condo.name, "ID:", condo.id);

    // Para cada usuario, crear o actualizar
    for (const userInfo of USERS_TO_CREATE) {
      console.log(`\n[v0] Procesando: ${userInfo.email}`);

      // Verificar si el usuario existe en auth
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) {
        console.error("[v0] Error listando usuarios:", listError);
        continue;
      }

      let authUser = users.users.find((u) => u.email === userInfo.email);

      if (!authUser) {
        // Crear usuario en auth
        console.log("[v0] Creando usuario en auth...");
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: userInfo.email,
          password: userInfo.password,
          email_confirm: true,
          user_metadata: {
            first_name: userInfo.first_name,
            last_name: userInfo.last_name,
            role: userInfo.role,
          },
        });

        if (createError) {
          console.error("[v0] Error creando usuario:", createError);
          continue;
        }

        authUser = newUser.user;
        console.log("[v0] Usuario creado en auth:", authUser.id);
      } else {
        console.log("[v0] Usuario ya existe en auth:", authUser.id);
      }

      // Crear o actualizar profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", authUser.id)
        .single();

      if (!profile) {
        // Crear profile
        console.log("[v0] Creando profile...");
        const { error: createProfileError } = await supabase
          .from("profiles")
          .insert({
            id: authUser.id,
            email: userInfo.email,
            first_name: userInfo.first_name,
            last_name: userInfo.last_name,
            role: userInfo.role,
            condo_id: condo.id,
          });

        if (createProfileError) {
          console.error("[v0] Error creando profile:", createProfileError);
          continue;
        }

        console.log("[v0] Profile creado exitosamente");
      } else {
        // Actualizar profile con condo_id y role
        console.log("[v0] Actualizando profile...");
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            role: userInfo.role,
            condo_id: condo.id,
            first_name: userInfo.first_name,
            last_name: userInfo.last_name,
          })
          .eq("id", authUser.id);

        if (updateError) {
          console.error("[v0] Error actualizando profile:", updateError);
          continue;
        }

        console.log("[v0] Profile actualizado exitosamente");
      }

      console.log(`[v0] ✅ ${userInfo.email} vinculado al condominio ${condo.name}`);
    }

    console.log("\n[v0] ✅ Proceso completado exitosamente!");
    console.log("\n[v0] Credenciales de los usuarios:");
    USERS_TO_CREATE.forEach((user) => {
      console.log(`   - ${user.email} / ${user.password}`);
    });
  } catch (error) {
    console.error("[v0] Error general:", error);
  }
}

main();
