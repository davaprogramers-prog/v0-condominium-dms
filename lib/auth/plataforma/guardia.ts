import { cache } from "react"
import { NextResponse } from "next/server"
import type { User } from "@supabase/supabase-js"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { MFA_RECIENTE_SEGUNDOS, type AccionMfaReciente, type Capacidad } from "./capacidades"
import {
  decidirAccesoGlobal,
  estadoHttp,
  mfaEsReciente,
  MENSAJE_DENEGADO,
  type Decision,
  type MotivoRechazo,
  type RegistroSuperAdmin,
} from "./decision"
import { registrarAuditoria } from "./auditoria"

type Supabase = Awaited<ReturnType<typeof createClient>>

export type SesionVerificada = {
  supabase: Supabase
  usuario: User | null
  aal: string | null
  amr: unknown
  error: boolean
}

/** Usuario verificado por el proveedor (getUser) + claims firmados (getClaims) del mismo usuario. */
export const leerSesionVerificada = cache(async (): Promise<SesionVerificada> => {
  const supabase = await createClient()
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) return { supabase, usuario: null, aal: null, amr: null, error: false }
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims()
    if (claimsError || !claimsData?.claims || claimsData.claims.sub !== userData.user.id) {
      return { supabase, usuario: userData.user, aal: null, amr: null, error: true }
    }
    const claims = claimsData.claims as { aal?: string; amr?: unknown }
    return { supabase, usuario: userData.user, aal: claims.aal ?? null, amr: claims.amr ?? null, error: false }
  } catch {
    return { supabase, usuario: null, aal: null, amr: null, error: true }
  }
})

export const leerRegistroSuperAdmin = cache(
  async (userId: string): Promise<{ registro: RegistroSuperAdmin | null; error: boolean }> => {
    try {
      const service = createServiceClient()
      const { data, error } = await service
        .from("platform_super_admins")
        .select("user_id, email, activo")
        .eq("user_id", userId)
        .maybeSingle()
      if (error) return { registro: null, error: true }
      return { registro: (data as RegistroSuperAdmin | null) ?? null, error: false }
    } catch {
      return { registro: null, error: true }
    }
  },
)

export type EvaluacionGlobal = {
  sesion: SesionVerificada
  registro: RegistroSuperAdmin | null
  decision: Decision
}

export const evaluarSuperAdmin = cache(async (): Promise<EvaluacionGlobal> => {
  const sesion = await leerSesionVerificada()
  if (!sesion.usuario) {
    return { sesion, registro: null, decision: decidirAccesoGlobal({ usuarioId: null, correoSesion: null, registro: null, aal: null, error: sesion.error }) }
  }
  const { registro, error } = await leerRegistroSuperAdmin(sesion.usuario.id)
  const decision = decidirAccesoGlobal({
    usuarioId: sesion.usuario.id,
    correoSesion: sesion.usuario.email ?? null,
    registro,
    aal: sesion.aal,
    error: sesion.error || error,
  })
  return { sesion, registro, decision }
})

/**
 * Registro activo y correo coincidente, sin exigir AAL2. Solo para enrolar el primer factor
 * o entrar al paso de verificación: nunca otorga privilegios globales.
 */
export async function evaluarRegistroSinMfa(): Promise<
  { ok: true; usuario: User; supabase: Supabase; aal: string | null; amr: unknown } | { ok: false; motivo: MotivoRechazo }
> {
  const { sesion, registro } = await evaluarSuperAdmin()
  if (!sesion.usuario) return { ok: false, motivo: "SIN_SESION" }
  const d = decidirAccesoGlobal({
    usuarioId: sesion.usuario.id,
    correoSesion: sesion.usuario.email ?? null,
    registro,
    aal: "aal2",
    error: sesion.error,
  })
  if (!d.concedido) return { ok: false, motivo: d.motivo }
  return { ok: true, usuario: sesion.usuario, supabase: sesion.supabase, aal: sesion.aal, amr: sesion.amr }
}

/** Para pantallas de condominio: true solo con registro global activo + AAL2 verificados en el servidor. */
export async function esSuperAdminEfectivo(): Promise<boolean> {
  try {
    return (await evaluarSuperAdmin()).decision.concedido
  } catch {
    return false
  }
}

/** Rol que debe usar la UI: un 'super_admin' sin registro activo + AAL2 no tiene privilegios globales. */
export async function rolEfectivo(rol: string | null | undefined): Promise<string> {
  if (rol !== "super_admin") return rol ?? "guest"
  return (await esSuperAdminEfectivo()) ? "super_admin" : "guest"
}

export type ResultadoGuardia =
  | { ok: true; usuario: User; supabase: Supabase; registro: RegistroSuperAdmin; amr: unknown }
  | { ok: false; status: 401 | 403; motivo: MotivoRechazo }

export async function requireGlobalSuperAdmin(
  capacidad: Capacidad,
  opciones: { accionMfaReciente?: AccionMfaReciente; condoId?: string | null } = {},
): Promise<ResultadoGuardia> {
  const { sesion, registro, decision } = await evaluarSuperAdmin()
  const actorId = sesion.usuario?.id ?? null
  const accion = opciones.accionMfaReciente ?? `acceso:${capacidad}`

  if (!decision.concedido) {
    if (actorId) {
      await registrarAuditoria({ actorId, accion, resultado: "denegado", condoId: opciones.condoId, motivo: decision.motivo })
    }
    return { ok: false, status: estadoHttp(decision.motivo), motivo: decision.motivo }
  }

  if (opciones.accionMfaReciente && !mfaEsReciente(sesion.amr, Math.floor(Date.now() / 1000), MFA_RECIENTE_SEGUNDOS)) {
    await registrarAuditoria({ actorId, accion, resultado: "denegado", condoId: opciones.condoId, motivo: "MFA_NO_RECIENTE" })
    return { ok: false, status: 403, motivo: "MFA_NO_RECIENTE" }
  }

  return { ok: true, usuario: sesion.usuario!, supabase: sesion.supabase, registro: registro!, amr: sesion.amr }
}

export function respuestaDenegada(r: Extract<ResultadoGuardia, { ok: false }>) {
  const error = r.motivo === "MFA_NO_RECIENTE" ? "Vuelve a validar tu código de verificación para continuar." : MENSAJE_DENEGADO
  return NextResponse.json({ error, codigo: r.motivo === "MFA_NO_RECIENTE" ? "MFA_NO_RECIENTE" : "DENEGADO" }, { status: r.status })
}
