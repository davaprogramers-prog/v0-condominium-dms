"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

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
  const serviceClient = createServiceClient()

  // Get house details to get condo_id
  const { data: house, error: houseError } = await supabase
    .from("houses")
    .select("id, condo_id")
    .eq("id", houseId)
    .single()

  if (houseError || !house) throw new Error("Casa no válida")

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

  // If user already exists, that's fine - we'll just ensure profile is updated
  if (authError && authError.message.includes("already registered")) {
    console.log("[v0] User already registered, attempting to get their auth user...")
    
    // User already exists, try to get their current user
    const { data: { user: existingUser } } = await supabase.auth.getUser()
    
    if (existingUser?.email === email) {
      // Logged in user - update their profile
      console.log("[v0] Updating profile for existing logged-in user:", existingUser.id)
      
      const { error: updateError } = await serviceClient
        .from("profiles")
        .update({
          house_id: houseId,
          condo_id: house.condo_id,
          first_name: firstName,
          last_name: lastName,
        })
        .eq("id", existingUser.id)
      
      if (updateError) throw new Error("Error al actualizar perfil: " + updateError.message)
      
      return existingUser
    } else {
      // Different user exists with this email - can't register
      throw new Error("El email ya está registrado. Intenta iniciar sesión.")
    }
  }

  if (authError) throw authError
  if (!authData.user) throw new Error("No se pudo crear la cuenta")

  const userId = authData.user.id

  // Wait 1 second for auth to be ready
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Create profile with all data including condo_id using service client
  const { error: profileError } = await serviceClient
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
    // If insert fails due to duplicate, try update
    if (profileError.code === "23505") {
      const { error: updateError } = await serviceClient
        .from("profiles")
        .update({
          house_id: houseId,
          condo_id: house.condo_id,
          first_name: firstName,
          last_name: lastName,
        })
        .eq("id", userId)
      
      if (updateError) throw new Error("Error al actualizar perfil: " + updateError.message)
    } else {
      throw new Error("Error al crear el perfil")
    }
  }

  console.log("[v0] User registered with profile:", userId, "condo_id:", house.condo_id)

  return authData.user
}

export async function ensureUserProfile(userId: string, email: string) {
  try {
    // Use service client to bypass RLS for profile creation
    const supabase = createServiceClient()

    console.log("[v0] ensureUserProfile START - userId:", userId, "email:", email)

    // Buscar en public.houses por owner_email
    const { data: house, error: houseErr } = await supabase
      .from("houses")
      .select("id, condo_id, owner_name")
      .eq("owner_email", email)
      .single()

    console.log("[v0] House query - found:", !!house, "error:", houseErr?.message)

    if (!house) {
      console.log("[v0] No house found for email:", email)
      return { success: false }
    }

    console.log("[v0] House data:", { id: house.id, condo_id: house.condo_id, owner_name: house.owner_name })

    // INSERT en profiles usando service client (bypasses RLS)
    console.log("[v0] Attempting INSERT into profiles...")
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

    console.log("[v0] INSERT - error:", insertError?.message, "code:", insertError?.code, "success:", !insertError)

    // Si ya existe, hacer UPDATE
    if (insertError) {
      console.log("[v0] INSERT failed with code", insertError.code, "- attempting UPDATE...")
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({
          house_id: house.id,
          condo_id: house.condo_id,
        })
        .eq("id", userId)
      console.log("[v0] UPDATE - error:", updateErr?.message)
    } else {
      console.log("[v0] INSERT SUCCESS - Profile created")
    }

    // UPDATE houses con owner_user_id
    console.log("[v0] Updating houses table with owner_user_id:", userId)
    const { error: houseUpdateErr } = await supabase
      .from("houses")
      .update({ owner_user_id: userId })
      .eq("id", house.id)

    console.log("[v0] House update - error:", houseUpdateErr?.message)
    console.log("[v0] ensureUserProfile COMPLETE")

    return { success: true }
  } catch (err: any) {
    console.error("[v0] ensureUserProfile EXCEPTION:", err?.message, err)
    return { success: false, error: err?.message }
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
