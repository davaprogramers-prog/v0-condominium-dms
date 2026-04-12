"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function login(formData: FormData) {
  const supabase = await createClient()
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }
  const { error } = await supabase.auth.signInWithPassword(data)
  if (error) {
    return redirect("/auth/login?error=" + encodeURIComponent(error.message))
  }
  return redirect("/dashboard")
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const firstName = formData.get("first_name") as string
  const lastName = formData.get("last_name") as string
  const role = (formData.get("role") as string) || "owner"

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
        role,
      },
    },
  })

  if (error) {
    return redirect("/auth/registro?error=" + encodeURIComponent(error.message))
  }
  return redirect("/auth/registro-exitoso")
}

export async function registerOwner(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  houseId: string
) {
  const supabase = await createClient()

  // Get house details to get condo_id
  const { data: house, error: houseError } = await supabase
    .from("houses")
    .select("id, condo_id")
    .eq("id", houseId)
    .single()

  if (houseError || !house) throw new Error("Casa no válida")

  // Sign up user
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

  if (authError && authError.message.includes("already registered")) {
    throw new Error("El email ya está registrado. Intenta iniciar sesión.")
  }

  if (authError) throw authError
  if (!authData.user) throw new Error("No se pudo crear la cuenta")

  const userId = authData.user.id

  // Wait 1 second for auth to be ready
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Create profile with all data including condo_id
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({
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
    throw new Error("Error al crear el perfil")
  }

  console.log("[v0] User registered with profile:", userId, "condo_id:", house.condo_id)

  return authData.user
}

export async function ensureUserProfile(userId: string, email: string) {
  const supabase = await createClient()

  console.log("[v0] ensureUserProfile called with:", userId, email)

  // Check if profile exists
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, condo_id, house_id")
    .eq("id", userId)
    .single()

  console.log("[v0] Profile lookup result:", profile, profileError)

  // If profile exists and has condo_id, we're done
  if (profile?.condo_id) {
    console.log("[v0] Profile already has condo_id:", profile.condo_id)
    return { success: true, message: "Profile ya completo" }
  }

  // Get house owner data
  const { data: houseOwner, error: houseError } = await supabase
    .from("house_owners")
    .select("house_id, houses(id, condo_id)")
    .eq("user_email", email)
    .single()

  console.log("[v0] House owner lookup:", houseOwner, houseError)

  if (!houseOwner?.houses) {
    console.log("[v0] No house found for email:", email)
    return { success: false, message: "No hay casa asignada para este email" }
  }

  const condoId = houseOwner.houses.condo_id
  const houseId = houseOwner.houses.id

  // If profile exists but no condo_id, update it
  if (profile && !profile.condo_id) {
    console.log("[v0] Updating existing profile with condo_id:", condoId)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ condo_id: condoId, house_id: houseId })
      .eq("id", userId)

    if (updateError) {
      console.error("[v0] Error updating profile:", updateError)
      return { success: false, message: "Error al actualizar perfil" }
    }
    return { success: true, message: "Profile actualizado con condo_id" }
  }

  // If profile doesn't exist, create it from house_owners
  if (!profile) {
    console.log("[v0] Creating new profile with condo_id:", condoId)
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email,
        first_name: email.split("@")[0],
        last_name: "",
        house_id: houseId,
        condo_id: condoId,
        role: "owner",
      })

    if (insertError) {
      console.error("[v0] Error creating profile on login:", insertError)
      return { success: false, message: "Error al crear perfil" }
    }

    console.log("[v0] Profile created successfully")
    return { success: true, message: "Profile creado desde house_owners" }
  }

  console.log("[v0] Profile verification complete")
  return { success: true, message: "Profile verificado" }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
