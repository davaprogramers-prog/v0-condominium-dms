'use server'

import { autorizarAdminDeCondominio } from "@/lib/auth/condominio"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

/** Lee el condominio del tipo de documento desde la BD (nunca del cliente) y exige ser su administrador. */
async function autorizarTipo(typeId: string) {
  const admin = createAdminClient()
  const { data: tipo } = await admin.from("document_types").select("id, condo_id").eq("id", typeId).maybeSingle()
  if (!tipo) return { ok: false as const, error: "Tipo de documento no encontrado" }
  const acceso = await autorizarAdminDeCondominio(tipo.condo_id)
  if (!acceso.ok) return { ok: false as const, error: acceso.error }
  return { ok: true as const, admin, condoId: tipo.condo_id as string }
}

export async function createDocumentType(
  condoId: string,
  name: string,
  description?: string
) {
  try {
    const acceso = await autorizarAdminDeCondominio(condoId)
    if (!acceso.ok) return { error: acceso.error }

    const { data, error } = await createAdminClient()
      .from("document_types")
      .insert([{ condo_id: condoId, name, description: description || null }])
      .select()

    if (error) {
      console.error("Error creating document type:", error)
      return { error: error.message }
    }

    revalidatePath("/dashboard/documentos")
    return { data, error: null }
  } catch (e) {
    console.error("Exception creating document type:", e)
    return { error: "Error inesperado al crear el tipo de documento" }
  }
}

export async function deleteDocumentType(typeId: string) {
  try {
    const acceso = await autorizarTipo(typeId)
    if (!acceso.ok) return { error: acceso.error }

    const { error } = await acceso.admin
      .from("document_types")
      .delete()
      .eq("id", typeId)
      .eq("condo_id", acceso.condoId)

    if (error) {
      console.error("Error deleting document type:", error)
      return { error: error.message }
    }

    revalidatePath("/dashboard/documentos")
    return { error: null }
  } catch (e) {
    console.error("Exception deleting document type:", e)
    return { error: "Error inesperado al eliminar el tipo de documento" }
  }
}

export async function updateDocumentType(formData: FormData) {
  const typeId = formData.get("id") as string
  const name = formData.get("name") as string
  const description = (formData.get("description") as string) || null

  if (!typeId || !name) {
    throw new Error("ID y nombre son requeridos")
  }

  const acceso = await autorizarTipo(typeId)
  if (!acceso.ok) throw new Error(acceso.error)

  const { error } = await acceso.admin
    .from("document_types")
    .update({ name, description })
    .eq("id", typeId)
    .eq("condo_id", acceso.condoId)

  if (error) {
    console.error("Error updating document type:", error)
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/documentos")
  return { error: null }
}
