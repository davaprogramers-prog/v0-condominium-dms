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

  // Get house details first
  const { data: house, error: houseError } = await supabase
    .from("houses")
    .select("id, condo_id")
    .eq("id", houseId)
    .single()

  if (houseError || !house) throw new Error("Casa no válida")

  // Try to sign up the user
  let authData
  let isNewUser = false
  
  const { data: signupData, error: authError } = await supabase.auth.signUp({
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

  // If email already exists in auth, that's ok - we just need the user to exist
  // If it's a different error, throw it
  if (authError && authError.message.includes("already registered")) {
    console.log("[v0] Email already registered, attempting to link profile")
    
    // Try to get existing user ID via signIn with password
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (signInError) {
      // If sign in fails, the user exists but password might be different
      // In this case, we'll create a profile but won't be able to auth yet
      console.log("[v0] Sign in failed:", signInError.message)
      throw new Error("El email ya existe. Intenta iniciar sesión con tu contraseña.")
    }
    
    authData = signInData
  } else if (authError) {
    throw authError
  } else {
    authData = signupData
    isNewUser = true
  }

  if (!authData.user) throw new Error("No se pudo crear la cuenta")

  console.log("[v0] Auth user ready:", authData.user.id, "isNewUser:", isNewUser)

  // First, ensure the user exists in the public users table (required by foreign key)
  // This is needed because auth.users and public.users are separate
  const { error: userTableError } = await supabase
    .from("users")
    .upsert({
      id: authData.user.id,
      email,
    }, { onConflict: "id" })

  if (userTableError) {
    console.error("[v0] Error inserting into users table:", userTableError)
  }

  // Now create/update the profile
  // Retry up to 10 times with increasing delays
  let lastError = null
  for (let attempt = 1; attempt <= 10; attempt++) {
    await new Promise(resolve => setTimeout(resolve, attempt * 1000))

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
      console.log("[v0] Profile created successfully on attempt", attempt)
      break
    }

    lastError = profileError
    console.error(`[v0] Profile upsert attempt ${attempt} failed:`, profileError)
  }

  // If all retries failed, throw the error
  if (lastError) {
    console.error("[v0] All profile creation attempts failed:", lastError)
    if (lastError.code === '23503') {
      throw new Error("Error al crear el perfil. Por favor, intenta de nuevo.")
    }
    throw lastError
  }

  return authData.user
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return redirect("/auth/login")
}
