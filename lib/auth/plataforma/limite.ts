import { createServiceClient } from "@/lib/supabase/server"
import { ipSolicitud } from "./auditoria"

export const LIMITES = {
  login: { max: 5, ventana: 15 * 60, maxIp: 30 },
  totp: { max: 5, ventana: 15 * 60, maxIp: 30 },
  recuperacion: { max: 5, ventana: 60 * 60, maxIp: 20 },
  bootstrap: { max: 3, ventana: 60 * 60, maxIp: 10 },
  reautenticacion: { max: 5, ventana: 15 * 60, maxIp: 30 },
  // Clics en "Probar demo": la identidad ya es la huella de IP; el cupo de altas vive en demo_config.
  demo: { max: 20, ventana: 15 * 60, maxIp: 20 },
} as const

export type AccionLimitada = keyof typeof LIMITES

async function consumir(clave: string, max: number, ventana: number): Promise<number> {
  try {
    const service = createServiceClient()
    const { data, error } = await service.rpc("fn_plataforma_consumir_intento", {
      p_clave: clave,
      p_max: max,
      p_ventana_seg: ventana,
    })
    if (error) throw error
    return typeof data === "number" ? data : 60
  } catch (err) {
    console.error("[plataforma] límite de intentos no disponible:", (err as Error).message)
    return 60
  }
}

/** Consume un intento por identidad y por IP. Devuelve segundos de espera (0 = permitido). Falla cerrado. */
export async function consumirIntento(accion: AccionLimitada, identidad: string): Promise<number> {
  const l = LIMITES[accion]
  const ip = (await ipSolicitud()) ?? "sin-ip"
  const [porIdentidad, porIp] = await Promise.all([
    consumir(`${accion}:id:${identidad.toLowerCase()}`, l.max, l.ventana),
    consumir(`${accion}:ip:${ip}`, l.maxIp, l.ventana),
  ])
  return Math.max(porIdentidad, porIp)
}

export async function reiniciarIntentos(accion: AccionLimitada, identidad: string): Promise<void> {
  try {
    const service = createServiceClient()
    await service.rpc("fn_plataforma_reiniciar_intentos", { p_clave: `${accion}:id:${identidad.toLowerCase()}` })
  } catch {
    // Sin efecto: la ventana vence sola.
  }
}

export function mensajeEspera(segundos: number): string {
  const minutos = Math.max(1, Math.ceil(segundos / 60))
  return `Demasiados intentos. Intenta de nuevo en ${minutos} ${minutos === 1 ? "minuto" : "minutos"}.`
}
