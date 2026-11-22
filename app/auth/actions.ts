"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { consumirIntento, mensajeEspera } from "@/lib/auth/plataforma/limite"

export async function login(formData: FormData) {
  const supabase = await createClient()
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }
  const { error, data: authData } = await supabase.auth.signInWithPassword(data)
  if (error) {
    return redirect("/auth/login?error=" + encodeURIComponent(error.message))
  }

  // Ensure user profile is set up correctly
  if (authData?.user) {
    const result = await ensureUserProfile(authData.user.id, authData.user.email || "")
    console.log("[v0] Login ensureUserProfile result:", result)
  }

  return redirect("/dashboard")
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const firstName = formData.get("first_name") as string
  const lastName = formData.get("last_name") as string
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  })

  if (error) {
    return redirect("/auth/registro?error=" + encodeURIComponent(error.message))
  }
  return redirect("/auth/registro-exitoso")
}

type RegisterResult = { success: true } | { success: false; error: string }

export type PropiedadRegistro = { id: string; house_number: number; condo_id: string; condoName: string }

/**
 * Paso 1 del registro. Antes el navegador leía `houses` como anónimo (la política dejaba leer todas las casas
 * con sus correos). Ahora se consulta en el servidor, con límite de intentos, y solo vuelve lo necesario.
 */
export async function buscarPropiedadesPorCorreo(
  correo: string,
): Promise<{ ok: true; propiedades: PropiedadRegistro[] } | { ok: false; error: string }> {
  const email = String(correo || "").trim().toLowerCase()
  if (!email || email.length > 254 || !email.includes("@")) return { ok: false, error: "Correo no válido" }

  const espera = await consumirIntento("recuperacion", `registro-busqueda:${email}`)
  if (espera > 0) return { ok: false, error: mensajeEspera(espera) }

  const { data, error } = await createServiceClient()
    .from("houses")
    .select("id, house_number, condo_id, condominiums(name)")
    .ilike("owner_email", email)
  if (error) return { ok: false, error: "No se pudo validar el correo" }

  return {
    ok: true,
    propiedades: (data ?? []).map((h: any) => ({
      id: h.id,
      house_number: h.house_number,
      condo_id: h.condo_id,
      condoName: h.condominiums?.name || "Condominio",
    })),
  }
}

export async function registerOwner(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  houseId: string
): Promise<RegisterResult> {
  const supabase = await createClient()
  const serviceClient = createServiceClient()
  email = String(email || "").trim().toLowerCase()

  const espera = await consumirIntento("recuperacion", `registro:${email}`)
  if (espera > 0) return { success: false, error: mensajeEspera(espera) }

  // La casa debe estar registrada a ESTE correo (antes bastaba cualquier id de casa).
  const { data: house, error: houseError } = await serviceClient
    .from("houses")
    .select("id, condo_id")
    .eq("id", houseId)
    .ilike("owner_email", email)
    .maybeSingle()

  if (houseError || !house) {
    return { success: false, error: "Casa no válida" }
  }

  // Try to sign up new user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      data: {
        first_name: firstName,
        last_name: lastName,
        role: "owner",
      },
    },
  })

  // Handle specific database errors
  if (authError && authError.message.includes("Database error")) {
    console.error("[v0] Database error during signup:", authError)
    return { success: false, error: "Error en la base de datos. Por favor contacta al administrador para verificar la configuración del sistema." }
  }

  // Cuenta existente: antes se sobrescribía su perfil (rol y condominio) sin probar que fuera suya.
  // Ahora debe iniciar sesión; ensureUserProfile vincula sus casas tras autenticarse.
  if (authError && (authError.message.includes("already registered") || authError.message.includes("already been registered"))) {
    return { success: false, error: "El email ya está registrado. Intenta iniciar sesión." }
  }

  if (authError) {
    console.error("[v0] Signup auth error:", authError)
    return { success: false, error: authError.message }
  }
  if (!authData.user) {
    return { success: false, error: "No se pudo crear la cuenta" }
  }

  const userId = authData.user.id

  // Wait for auth trigger to be ready
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Create/update profile with all data including condo_id using service client
  const { error: profileError } = await serviceClient
    .from("profiles")
    .upsert({
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      house_id: houseId,
      condo_id: house.condo_id,
      role: "owner",
    })

  if (profileError) {
    console.error("[v0] Profile creation error:", profileError)
    return { success: false, error: "Error al crear el perfil: " + profileError.message }
  }

  console.log("[v0] User registered with profile:", userId, "condo_id:", house.condo_id)

  return { success: true }
}

export async function ensureUserProfile(userId: string, email: string) {
  try {
    const sesion = await createClient()
    const { data: { user: usuarioSesion } } = await sesion.auth.getUser()
    if (!usuarioSesion || usuarioSesion.id !== userId) {
      return { success: false, error: "No autorizado" }
    }
    email = usuarioSesion.email ?? email

    // Use service client to bypass RLS for profile creation
    const supabase = createServiceClient()

    console.log("[v0] ensureUserProfile START - userId:", userId, "email:", email)

    // Buscar en public.houses por owner_email (para propietarios)
    const { data: houses, error: housesErr } = await supabase
      .from("houses")
      .select("id, condo_id, owner_name")
      .eq("owner_email", email)

    console.log("[v0] Houses query - found:", houses?.length || 0, "houses:", houses?.map(h => ({ id: h.id, condo_id: h.condo_id })), "error:", housesErr?.message)
    console.log("[v0] DEBUG: hasMultipleProperties should be:", (houses?.length || 0) > 1)

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (existingProfile) {
      console.log("[v0] Profile already exists for user:", userId, "role:", existingProfile.role, "current condo_id:", existingProfile.condo_id)
      console.log("[v0] RETURNING with hasMultipleProperties:", (houses?.length || 0) > 1)
      // Return existing profile info BUT include hasMultipleProperties based on actual houses count
      return { success: true, role: existingProfile.role, hasMultipleProperties: (houses?.length || 0) > 1 }
    }

    if (houses && houses.length > 0) {
      // User is a property owner - associate with first house and condo
      const firstHouse = houses[0]
      console.log("[v0] First house data:", { id: firstHouse.id, condo_id: firstHouse.condo_id, owner_name: firstHouse.owner_name })

      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email,
          first_name: firstHouse.owner_name || email.split("@")[0],
          last_name: "",
          house_id: firstHouse.id,
          condo_id: firstHouse.condo_id,
          role: "propietario",
        })

      if (insertError && insertError.code !== "23505") {
        console.log("[v0] INSERT error:", insertError.message)
        return { success: false, error: insertError.message }
      }

      console.log("[v0] NEW PROFILE CREATED - hasMultipleProperties:", houses.length > 1)
      return { success: true, role: "propietario", hasMultipleProperties: houses.length > 1 }
    } else {
      // No house found - user might be conserje, admin, etc.
      // Get the condo_id from auth user metadata if available
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId)
      // Solo app_metadata (controlado por el servidor); user_metadata lo edita el propio usuario.
      const condoId = authUser?.app_metadata?.condo_id
      const rolApp = authUser?.app_metadata?.role
      const role = ["admin", "conserje", "owner", "propietario"].includes(rolApp) ? rolApp : "propietario"

      if (condoId) {
        // User has condo_id but no house - likely conserje, admin, etc.
        console.log("[v0] Creating profile for non-owner user with condo_id:", condoId, "role:", role)
        
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            email,
            first_name: email.split("@")[0],
            last_name: "",
            condo_id: condoId,
            role: role,
          })

        if (insertError && insertError.code !== "23505") {
          console.log("[v0] INSERT error for non-owner:", insertError.message)
          return { success: false, error: insertError.message }
        }

        return { success: true, role: role }
      } else {
        // No condo_id and no house - can't assign
        console.log("[v0] No house and no condo_id - cannot auto-assign")
        return { success: false, message: "Awaiting admin assignment" }
      }
    }
  } catch (err) {
    console.error("[v0] ensureUserProfile ERROR:", err)
    return { success: false, error: String(err) }
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
