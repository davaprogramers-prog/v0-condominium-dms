'use server'

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

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
        },
      ])
      .select()

    if (error) {
      console.error("[v0] Error creating document type:", error)
      return { error: error.message }
    }

    // Revalidate to refresh the page data
    revalidatePath("/dashboard/documentos")

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

    // Revalidate to refresh the page data
    revalidatePath("/dashboard/documentos")

    return { error: null }
  } catch (e) {
    console.error("[v0] Exception deleting document type:", e)
    return { error: String(e) }
  }
}

export async function updateDocumentType(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("No autenticado")
    }

    const typeId = formData.get("id") as string
    const name = formData.get("name") as string
    const description = formData.get("description") as string || null

    if (!typeId || !name) {
      throw new Error("ID y nombre son requeridos")
    }

    // Use admin client
    const admin = createAdminClient()

    const { error } = await admin
      .from("document_types")
      .update({
        name,
        description,
      })
      .eq("id", typeId)

    if (error) {
      console.error("[v0] Error updating document type:", error)
      throw new Error(error.message)
    }

    // Revalidate to refresh the page data
    revalidatePath("/dashboard/documentos")

    return { error: null }
  } catch (e) {
    console.error("[v0] Exception updating document type:", e)
    throw e
  }
}
