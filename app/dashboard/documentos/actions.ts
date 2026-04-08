'use server'

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function createDocumentType(
  condoId: string,
  name: string,
  description?: string
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "No autenticado" }
    }

    // Use admin client to bypass RLS for administrative operations
    const admin = createAdminClient()

    const { data, error } = await admin
      .from("document_types")
      .insert([
        {
          condo_id: condoId,
          name,
          description: description || null,
          created_by: user.id,
        },
      ])
      .select()

    if (error) {
      console.error("[v0] Error creating document type:", error)
      return { error: error.message }
    }

    return { data, error: null }
  } catch (e) {
    console.error("[v0] Exception creating document type:", e)
    return { error: String(e) }
  }
}

export async function deleteDocumentType(typeId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "No autenticado" }
    }

    // Use admin client
    const admin = createAdminClient()

    const { error } = await admin
      .from("document_types")
      .delete()
      .eq("id", typeId)

    if (error) {
      console.error("[v0] Error deleting document type:", error)
      return { error: error.message }
    }

    return { error: null }
  } catch (e) {
    console.error("[v0] Exception deleting document type:", e)
    return { error: String(e) }
  }
}
