import { headers } from "next/headers"
import { createServiceClient } from "@/lib/supabase/server"

export type ResultadoAuditoria = "concedido" | "denegado" | "error"

export type EntradaAuditoria = {
  actorId: string | null
  accion: string
  resultado: ResultadoAuditoria
  condoId?: string | null
  objetivoUserId?: string | null
  motivo?: string | null
}

export async function ipSolicitud(): Promise<string | null> {
  try {
    const h = await headers()
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null
    return ip ? ip.slice(0, 64) : null
  } catch {
    return null
  }
}

export async function registrarAuditoria(e: EntradaAuditoria): Promise<boolean> {
  try {
    const service = createServiceClient()
    const { error } = await service.from("platform_audit_log").insert({
      actor_id: e.actorId,
      accion: e.accion.slice(0, 80),
      resultado: e.resultado,
      condo_id: e.condoId ?? null,
      objetivo_user_id: e.objetivoUserId ?? null,
      motivo: e.motivo ? e.motivo.slice(0, 300) : null,
      ip: await ipSolicitud(),
    })
    if (error) {
      console.error("[plataforma] auditoría no registrada:", error.message)
      return false
    }
    return true
  } catch (err) {
    console.error("[plataforma] auditoría no registrada:", (err as Error).message)
    return false
  }
}
