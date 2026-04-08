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

  // Check if user is super_admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "super_admin") {
    throw new Error("Only super admins can upload logos")
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

  // Insert logo record (using service role via server action)
  const { data: newLogo, error: insertError } = await supabase
    .from("expense_logos")
    .insert({
      condo_id: null,
      name: logoName.trim(),
      logo_url: publicUrl,
    })
    .select()
    .single()

  if (insertError) {
    throw new Error(`Database error: ${insertError.message}`)
  }

  return newLogo
}
