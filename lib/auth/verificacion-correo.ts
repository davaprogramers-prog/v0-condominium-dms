import { createHmac, randomInt } from "node:crypto"
import type { User } from "@supabase/supabase-js"

export const MINUTOS_VIGENCIA_CODIGO = 15

/** Solo el servidor fija este indicador (app_metadata), tras validar un código enviado al correo. */
export function correoVerificado(usuario: Pick<User, "app_metadata"> | null | undefined): boolean {
  return usuario?.app_metadata?.correo_verificado === true
}

export function generarCodigoCorreo(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0")
}

function pimienta(): string {
  const secreto = process.env.SUPABASE_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secreto) throw new Error("Falta el secreto del servidor para los códigos de verificación")
  return secreto
}

/** HMAC del código ligado al correo: un hash filtrado no sirve para otro correo ni se revierte sin el secreto. */
export function hashCodigoCorreo(email: string, codigo: string): string {
  return createHmac("sha256", pimienta()).update(`registro:${email.trim().toLowerCase()}:${codigo}`).digest("hex")
}

export function htmlCorreoCodigo(codigo: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
      <h2 style="margin-bottom: 8px;">Confirma tu correo</h2>
      <p>Usa este código para terminar de crear tu cuenta en InteliCon:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 24px 0;">${codigo}</p>
      <p style="color: #6b7280; font-size: 13px;">Vence en ${MINUTOS_VIGENCIA_CODIGO} minutos y sirve una sola vez.</p>
      <p style="color: #6b7280; font-size: 13px;">Si no fuiste tú, ignora este correo: nadie podrá usar tu propiedad sin este código.</p>
    </div>
  `
}
