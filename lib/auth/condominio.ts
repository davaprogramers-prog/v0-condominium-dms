import { createClient, createServiceClient } from "@/lib/supabase/server"
import { esSuperAdminEfectivo } from "@/lib/auth/plataforma/guardia"
import { esUsuarioDemo } from "@/lib/demo/reglas"

export type AccesoAdminCondominio =
  | { ok: true; userId: string; condoId: string; esSuperAdmin: boolean }
  | { ok: false; status: 401 | 403; error: string }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Para acciones con clave de servicio (saltan RLS) sobre un condominio: exige sesión verificada,
 * que no sea demo y que sea administrador DE ESE condominio o super admin efectivo (registro + AAL2).
 * El rol y el condominio se leen de la BD, nunca del cuerpo de la petición ni de user_metadata.
 */
export async function autorizarAdminDeCondominio(condoId: unknown): Promise<AccesoAdminCondominio> {
  if (typeof condoId !== "string" || !UUID.test(condoId)) {
    return { ok: false, status: 403, error: "No tienes permisos para este condominio" }
  }

  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const usuario = data.user
  if (!usuario) return { ok: false, status: 401, error: "No autenticado" }
  if (esUsuarioDemo(usuario)) return { ok: false, status: 403, error: "Acción no disponible en la demostración" }

  const { data: perfil, error } = await createServiceClient()
    .from("profiles")
    .select("role, condo_id")
    .eq("id", usuario.id)
    .maybeSingle()
  if (error || !perfil) return { ok: false, status: 403, error: "No tienes permisos para este condominio" }

  if (perfil.role === "super_admin" && (await esSuperAdminEfectivo())) {
    return { ok: true, userId: usuario.id, condoId, esSuperAdmin: true }
  }
  if (perfil.role === "admin" && perfil.condo_id === condoId) {
    return { ok: true, userId: usuario.id, condoId, esSuperAdmin: false }
  }
  return { ok: false, status: 403, error: "No tienes permisos para este condominio" }
}
