import { createServiceClient } from "@/lib/supabase/server"

/** Elimina todos los factores MFA del usuario y cierra todas sus sesiones (refresh tokens). */
export async function eliminarFactoresYSesiones(userId: string): Promise<void> {
  const service = createServiceClient()
  const { data, error } = await service.auth.admin.mfa.listFactors({ userId })
  if (error) throw new Error("No se pudieron leer los factores")
  for (const f of data?.factors ?? []) {
    const { error: e } = await service.auth.admin.mfa.deleteFactor({ userId, id: f.id })
    if (e) throw new Error("No se pudo eliminar un factor")
  }
  await cerrarSesiones(userId)
}

export async function cerrarSesiones(userId: string): Promise<number> {
  const service = createServiceClient()
  const { data, error } = await service.rpc("fn_plataforma_cerrar_sesiones", { p_user: userId })
  if (error) throw new Error("No se pudieron cerrar las sesiones")
  return typeof data === "number" ? data : 0
}
