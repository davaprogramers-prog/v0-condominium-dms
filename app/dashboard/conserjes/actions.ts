"use server"

import { autorizarAdminDeCondominio } from "@/lib/auth/condominio"
import { createClient as createAdminClient } from "@supabase/supabase-js"

function clienteServicio() {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")
}

async function exigirAdmin(condoId: string) {
  const acceso = await autorizarAdminDeCondominio(condoId)
  if (!acceso.ok) throw new Error(acceso.error)
  return acceso
}

export async function createConcierge(condoId: string, data: {
  email: string
  password: string
  firstName: string
  lastName: string
}) {
  await exigirAdmin(condoId)
  const adminSupabase = clienteServicio()
  const email = String(data.email || "").trim().toLowerCase()
  if (!email) throw new Error("Correo requerido")

  const { data: existingProfile } = await adminSupabase
    .from("profiles")
    .select("id, role, condo_id, email")
    .ilike("email", email)
    .maybeSingle()

  if (existingProfile) {
    if (existingProfile.condo_id === condoId && existingProfile.role === "conserje") {
      return { success: true, profile: existingProfile, alreadyExists: true }
    }
    // Antes se reasignaba la cuenta (de otro condominio o con otro rol): permitía apropiarse de cuentas ajenas.
    throw new Error("Este correo ya pertenece a otra cuenta. Usa un correo diferente.")
  }

  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password: data.password,
    email_confirm: true,
    user_metadata: { first_name: data.firstName, last_name: data.lastName },
    app_metadata: { role: "conserje" },
  })

  if (authError || !authData.user?.id) {
    // Un usuario Auth sin perfil también es una cuenta ajena: no se le asigna rol aquí.
    if (authError?.code === "email_exists") throw new Error("Este correo ya pertenece a otra cuenta. Usa un correo diferente.")
    console.error("Error creating auth user:", authError)
    throw new Error(authError?.message || "Error al crear usuario de autenticación")
  }

  const { data: profileData, error: profileError } = await adminSupabase
    .from("profiles")
    .upsert({
      id: authData.user.id,
      email,
      role: "conserje",
      condo_id: condoId,
      first_name: data.firstName,
      last_name: data.lastName,
    }, { onConflict: "id" })
    .select()
    .single()

  if (profileError) {
    console.error("Error creating profile:", profileError)
    await adminSupabase.auth.admin.deleteUser(authData.user.id).catch(() => {})
    throw new Error(profileError.message || "Error al crear perfil del conserje")
  }

  return { success: true, profile: profileData }
}

export async function getConcierges(condoId: string) {
  const acceso = await autorizarAdminDeCondominio(condoId)
  if (!acceso.ok) return []

  const { data, error } = await clienteServicio()
    .from("profiles")
    .select("*")
    .eq("condo_id", condoId)
    .eq("role", "conserje")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error getting concierges:", error)
    return []
  }
  return data || []
}

export async function updateConcierge(condoId: string, profileId: string, data: {
  firstName?: string
  lastName?: string
}) {
  await exigirAdmin(condoId)

  const { error } = await clienteServicio()
    .from("profiles")
    .update({ first_name: data.firstName, last_name: data.lastName })
    .eq("id", profileId)
    .eq("condo_id", condoId)
    .eq("role", "conserje")

  if (error) {
    console.error("Error updating concierge:", error)
    throw new Error(error.message)
  }
  return { success: true }
}

export async function deleteConcierge(condoId: string, profileId: string) {
  await exigirAdmin(condoId)
  const adminSupabase = clienteServicio()

  const { data: profileData, error: profileFetchError } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .eq("condo_id", condoId)
    .eq("role", "conserje")
    .maybeSingle()

  if (profileFetchError) {
    console.error("Error fetching profile:", profileFetchError)
    throw new Error("Error al buscar conserje")
  }
  if (!profileData) throw new Error("Conserje no encontrado en este condominio")

  const { error: profileError } = await adminSupabase
    .from("profiles")
    .delete()
    .eq("id", profileId)
    .eq("condo_id", condoId)
    .eq("role", "conserje")
  if (profileError) {
    console.error("Error deleting profile:", profileError)
    throw new Error(profileError.message)
  }

  // Solo se borra la cuenta Auth de un conserje verificado de este condominio.
  const { error: authError } = await adminSupabase.auth.admin.deleteUser(profileId)
  if (authError) console.warn("No se pudo borrar la cuenta Auth del conserje:", authError.message)

  return { success: true }
}
