import { createHash, createHmac, randomBytes } from "node:crypto"

export const ROLES_DEMO = {
  administrador: { interno: "admin", etiqueta: "Administrador" },
  conserje: { interno: "conserje", etiqueta: "Conserje" },
  residente: { interno: "propietario", etiqueta: "Residente" },
} as const

export type RolDemo = keyof typeof ROLES_DEMO
export type RolDemoInterno = (typeof ROLES_DEMO)[RolDemo]["interno"]

export const COOKIE_REANUDAR = "demo_reanudar"
export const DOMINIO_CORREO_DEMO = "demo.invalid"

export const MENSAJE_NO_DISPONIBLE = "La demostración no está disponible en este momento. Intenta más tarde."
export const MENSAJE_ACCION_BLOQUEADA = "Esta acción no está disponible en el modo demostración."
export const MENSAJE_SESION_ABIERTA =
  "Ya tienes una sesión iniciada. Cierra sesión antes de entrar a la demostración."

export function esRolDemo(valor: unknown): valor is RolDemo {
  return typeof valor === "string" && Object.prototype.hasOwnProperty.call(ROLES_DEMO, valor)
}

export function etiquetaRolInterno(rol: string | null | undefined): string {
  const encontrado = Object.values(ROLES_DEMO).find((r) => r.interno === rol)
  return encontrado?.etiqueta ?? "Visitante"
}

/** Secreto opaco de un solo uso para reanudar; solo viaja en una cookie HttpOnly. */
export function generarToken(): string {
  return randomBytes(32).toString("base64url")
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex")
}

export function tokenConFormatoValido(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token)
}

/** HMAC de la IP con un secreto del servidor: permite limitar por IP sin guardarla. */
export function huellaIp(ip: string, secreto: string): string {
  if (!secreto) throw new Error("Falta el secreto para la huella de IP")
  return createHmac("sha256", secreto).update(`demo-ip:${ip.trim().toLowerCase()}`, "utf8").digest("hex")
}

export function correoDemo(id: string): string {
  return `demo-${id}@${DOMINIO_CORREO_DEMO}`
}

export function claveTemporal(): string {
  return randomBytes(36).toString("base64url")
}

type ConMetadatos = { app_metadata?: Record<string, unknown> | null } | null | undefined

export function esUsuarioDemo(usuario: ConMetadatos): boolean {
  return usuario?.app_metadata?.demo === true
}
