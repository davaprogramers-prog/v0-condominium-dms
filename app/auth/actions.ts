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

  // Get house details first to validate
  const { data: house, error: houseError } = await supabase
    .from("houses")
    .select("id, condo_id")
    .eq("id", houseId)
    .single()

  if (houseError || !house) throw new Error("Casa no válida")

  // Sign up the user with house info in metadata
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
        house_id: houseId,
        condo_id: house.condo_id,
        role: "owner",
      },
    },
  })

  // If email already exists, user needs to login
  if (authError && authError.message.includes("already registered")) {
    throw new Error("El email ya está registrado. Intenta iniciar sesión.")
  }

  if (authError) throw authError
  if (!authData.user) throw new Error("No se pudo crear la cuenta")

  console.log("[v0] User registered successfully:", authData.user.id)

  // Profile will be created automatically on first login via dashboard layout
  // The house_id and condo_id are stored in user.user_metadata for later retrieval

  return authData.user
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return redirect("/auth/login")
}
