"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function uploadExpenseLogo(formData: FormData) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("No authenticated user")
  }

  // Check if user is super_admin and get their condo_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, condo_id")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "super_admin") {
    throw new Error("Only super admins can upload logos")
  }

  if (!profile?.condo_id) {
    throw new Error("Super admin must have a condo assigned")
  }

  // Get form data
  const logoFile = formData.get("logoFile") as File
  const logoName = formData.get("logoName") as string

  if (!logoFile || !logoName) {
    throw new Error("Missing file or name")
  }

  // Upload to storage
  const fileExt = logoFile.name.split(".").pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `expense-logos/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, logoFile)

  if (uploadError) {
    throw new Error(`Upload error: ${uploadError.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("documents")
    .getPublicUrl(filePath)

  // Insert logo record using user's condo_id (for RLS policy)
  // Logos are stored with a specific condo_id but marked as global via a flag
  const { data: newLogo, error: insertError } = await supabase
    .from("expense_logos")
    .insert({
      condo_id: profile.condo_id,
      name: logoName.trim(),
      logo_url: publicUrl,
    })
    .select()
    .single()

  if (insertError) {
    console.error("[v0] Insert error details:", insertError)
    throw new Error(`Database error: ${insertError.message}`)
  }

  console.log("[v0] Logo uploaded successfully:", newLogo)
  return newLogo
}
