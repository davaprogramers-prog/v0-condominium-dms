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

  // Create auth user
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
      },
    },
  })

  if (authError) throw authError
  if (!authData.user) throw new Error("No se pudo crear la cuenta")

  // Get house details
  const { data: house, error: houseError } = await supabase
    .from("houses")
    .select("id, condo_id")
    .eq("id", houseId)
    .single()

  if (houseError || !house) throw new Error("Casa no válida")

  // Wait for the user to be fully created in the users table
  // Retry up to 5 times with increasing delays
  let lastError = null
  for (let attempt = 1; attempt <= 5; attempt++) {
    await new Promise(resolve => setTimeout(resolve, attempt * 500))

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        house_id: houseId,
        condo_id: house.condo_id,
        role: "owner",
      }, { onConflict: "id" })

    if (!profileError) {
      // Success - profile created
      break
    }

    lastError = profileError
    console.error(`[v0] Profile upsert attempt ${attempt} failed:`, profileError)
  }

  // If all retries failed, throw the error
  if (lastError && lastError.code === '23503') {
    throw new Error("Error al crear el perfil. Por favor, intenta de nuevo.")
  }

  // Also update the house with the owner's user_id
  const { error: houseUpdateError } = await supabase
    .from("houses")
    .update({ owner_id: authData.user.id })
    .eq("id", houseId)

  if (houseUpdateError) {
    console.error("[v0] House update error:", houseUpdateError)
    // Don't throw - the profile was created, this is just metadata
  }

  return authData.user
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return redirect("/auth/login")
}
