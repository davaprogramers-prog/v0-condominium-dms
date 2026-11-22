export type RegistroSuperAdmin = {
  user_id: string
  email: string
  activo: boolean
}

export type EntradaDecision = {
  usuarioId: string | null
  correoSesion: string | null
  registro: RegistroSuperAdmin | null
  aal: string | null
  /** true si cualquier lectura falló: la decisión siempre es rechazo. */
  error?: boolean
}

export type MotivoRechazo =
  | "SIN_SESION"
  | "SIN_REGISTRO"
  | "REGISTRO_INACTIVO"
  | "CORREO_DISTINTO"
  | "REQUIERE_AAL2"
  | "MFA_NO_RECIENTE"
  | "ERROR"

export type Decision = { concedido: true } | { concedido: false; motivo: MotivoRechazo }

const normalizarCorreo = (c: string | null | undefined) => (c ?? "").trim().toLowerCase()

export function decidirAccesoGlobal(e: EntradaDecision): Decision {
  try {
    if (e.error) return { concedido: false, motivo: "ERROR" }
    if (!e.usuarioId) return { concedido: false, motivo: "SIN_SESION" }
    if (!e.registro || e.registro.user_id !== e.usuarioId) return { concedido: false, motivo: "SIN_REGISTRO" }
    if (e.registro.activo !== true) return { concedido: false, motivo: "REGISTRO_INACTIVO" }
    const correo = normalizarCorreo(e.correoSesion)
    if (!correo || correo !== normalizarCorreo(e.registro.email)) return { concedido: false, motivo: "CORREO_DISTINTO" }
    if (e.aal !== "aal2") return { concedido: false, motivo: "REQUIERE_AAL2" }
    return { concedido: true }
  } catch {
    return { concedido: false, motivo: "ERROR" }
  }
}

export type EntradaAmr = { method?: string; timestamp?: number } | string

/** Segundos (epoch) de la última verificación TOTP de la sesión, o null. */
export function ultimaVerificacionTotp(amr: unknown): number | null {
  if (!Array.isArray(amr)) return null
  let ultima: number | null = null
  for (const entrada of amr as EntradaAmr[]) {
    if (typeof entrada !== "object" || entrada === null) continue
    if (entrada.method !== "totp" || typeof entrada.timestamp !== "number") continue
    if (ultima === null || entrada.timestamp > ultima) ultima = entrada.timestamp
  }
  return ultima
}

export function mfaEsReciente(amr: unknown, ahoraSegundos: number, maxSegundos: number): boolean {
  const ultima = ultimaVerificacionTotp(amr)
  if (ultima === null) return false
  if (ultima > ahoraSegundos + 60) return false
  return ahoraSegundos - ultima <= maxSegundos
}

export function reautenticacionVigente(confirmadoAt: string | null | undefined, ahoraMs: number, maxSegundos: number): boolean {
  if (!confirmadoAt) return false
  const t = Date.parse(confirmadoAt)
  if (Number.isNaN(t) || t > ahoraMs + 60_000) return false
  return ahoraMs - t <= maxSegundos * 1000
}

export const MENSAJE_DENEGADO = "No tienes permiso para realizar esta acción."

export function estadoHttp(motivo: MotivoRechazo): 401 | 403 {
  return motivo === "SIN_SESION" ? 401 : 403
}
