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

  console.log("[v0] ensureUserProfile start:", userId, email)

  // Buscar en public.houses por owner_email
  const { data: house, error: houseErr } = await supabase
    .from("houses")
    .select("id, condo_id, owner_name")
    .eq("owner_email", email)
    .single()

  console.log("[v0] house query:", house, houseErr)

  if (!house) {
    console.log("[v0] No house found for email:", email)
    return { success: false }
  }

  console.log("[v0] Attempting INSERT into profiles...")

  // Intentar INSERT en profiles (si no existe)
  const { error: insertError, data: insertData } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email,
      first_name: house.owner_name || email.split("@")[0],
      last_name: "",
      house_id: house.id,
      condo_id: house.condo_id,
      role: "owner",
    })

  console.log("[v0] INSERT result:", { insertData, insertError: insertError?.message })

  // Si ya existe, hacer UPDATE
  if (insertError) {
    console.log("[v0] INSERT failed, attempting UPDATE...")
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        house_id: house.id,
        condo_id: house.condo_id,
      })
      .eq("id", userId)
    console.log("[v0] UPDATE result:", updateErr?.message)
  }

  // UPDATE houses: llenar owner_user_id
  console.log("[v0] Updating houses with owner_user_id...")
  const { error: houseUpdateErr } = await supabase
    .from("houses")
    .update({ owner_user_id: userId })
    .eq("id", house.id)

  console.log("[v0] House update result:", houseUpdateErr?.message)
  console.log("[v0] ensureUserProfile complete")

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
