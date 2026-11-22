"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { ensureUserProfile } from "@/app/auth/actions"
import { consumirIntento, mensajeEspera, reiniciarIntentos } from "@/lib/auth/plataforma/limite"
import { registrarAuditoria } from "@/lib/auth/plataforma/auditoria"
import { codigoCoincide, normalizarCodigo } from "@/lib/auth/plataforma/recuperacion"
import { eliminarFactoresYSesiones } from "@/lib/auth/plataforma/sesiones"

const CREDENCIALES_INVALIDAS = "Correo o contraseña incorrectos."
const CODIGO_INVALIDO = "El código no es válido o ya venció. Revisa tu aplicación de autenticación."

export type ResultadoIngreso =
  | { ok: false; error: string }
  | {
      ok: true
      requiereTotp: boolean
      rol: string | null
      variasPropiedades: boolean
      /** Super admin registrado sin factor: debe configurarlo en /plataforma. */
      configurarPlataforma: boolean
    }

export async function iniciarSesion(emailEntrada: string, password: string): Promise<ResultadoIngreso> {
  const email = typeof emailEntrada === "string" ? emailEntrada.trim().toLowerCase() : ""
  if (!email || !password || email.length > 254 || password.length > 200) {
    return { ok: false, error: CREDENCIALES_INVALIDAS }
  }

  const espera = await consumirIntento("login", email)
  if (espera > 0) return { ok: false, error: mensajeEspera(espera) }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    if (error?.code === "email_not_confirmed") {
      return { ok: false, error: "Debes confirmar tu correo antes de iniciar sesión." }
    }
    return { ok: false, error: CREDENCIALES_INVALIDAS }
  }
  await reiniciarIntentos("login", email)

  let rol: string | null = null
  let variasPropiedades = false
  try {
    const perfil = await ensureUserProfile(data.user.id, email)
    rol = (perfil as { role?: string })?.role ?? null
    variasPropiedades = Boolean((perfil as { hasMultipleProperties?: boolean })?.hasMultipleProperties)
  } catch (err) {
    console.error("[auth] Perfil no preparado tras el ingreso:", (err as Error).message)
  }

  const { data: nivel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  const requiereTotp = nivel?.nextLevel === "aal2" && nivel.currentLevel !== "aal2"

  let configurarPlataforma = false
  if (!requiereTotp) {
    const { data: registro } = await createServiceClient()
      .from("platform_super_admins")
      .select("activo")
      .eq("user_id", data.user.id)
      .maybeSingle()
    configurarPlataforma = registro?.activo === true
  }

  return { ok: true, requiereTotp, rol, variasPropiedades, configurarPlataforma }
}

export async function verificarTotpIngreso(codigo: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const limpio = typeof codigo === "string" ? codigo.replace(/\s/g, "") : ""
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const usuario = userData.user
  if (!usuario) return { ok: false, error: "Tu sesión expiró. Vuelve a iniciar sesión." }
  if (!/^\d{6}$/.test(limpio)) return { ok: false, error: "Ingresa los 6 dígitos del código." }

  const espera = await consumirIntento("totp", usuario.id)
  if (espera > 0) return { ok: false, error: mensajeEspera(espera) }

  const { data: factores, error: errorFactores } = await supabase.auth.mfa.listFactors()
  const factor = factores?.totp?.find((f) => f.status === "verified")
  if (errorFactores || !factor) return { ok: false, error: "Tu cuenta no tiene un factor de verificación activo." }

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: limpio })
  if (error) {
    await registrarAuditoria({ actorId: usuario.id, accion: "mfa.verificar", resultado: "denegado", motivo: "Código inválido" })
    return { ok: false, error: CODIGO_INVALIDO }
  }
  await reiniciarIntentos("totp", usuario.id)
  await registrarAuditoria({ actorId: usuario.id, accion: "mfa.verificar", resultado: "concedido" })
  return { ok: true }
}

/**
 * Un código de recuperación elimina el factor, cierra todas las sesiones y obliga a enrolar de nuevo.
 * No otorga privilegios globales por sí mismo.
 */
export async function usarCodigoRecuperacion(codigo: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  const usuario = userData.user
  if (!usuario) return { ok: false, error: "Tu sesión expiró. Vuelve a iniciar sesión." }

  const limpio = normalizarCodigo(typeof codigo === "string" ? codigo : "")
  if (limpio.length !== 10) return { ok: false, error: "El código de recuperación tiene 10 caracteres." }

  const espera = await consumirIntento("recuperacion", usuario.id)
  if (espera > 0) return { ok: false, error: mensajeEspera(espera) }

  const service = createServiceClient()
  const { data: codigos, error } = await service
    .from("platform_mfa_recovery_codes")
    .select("id, code_hash")
    .eq("user_id", usuario.id)
    .is("usado_at", null)
  if (error) return { ok: false, error: "No fue posible validar el código. Intenta de nuevo." }

  const coincide = (codigos ?? []).find((c) => codigoCoincide(limpio, c.code_hash))
  if (!coincide) {
    await registrarAuditoria({ actorId: usuario.id, accion: "mfa.recuperacion", resultado: "denegado", motivo: "Código inválido" })
    return { ok: false, error: "El código de recuperación no es válido o ya se usó." }
  }

  const { data: marcado } = await service
    .from("platform_mfa_recovery_codes")
    .update({ usado_at: new Date().toISOString() })
    .eq("id", coincide.id)
    .is("usado_at", null)
    .select("id")
  if (!marcado || marcado.length === 0) return { ok: false, error: "El código de recuperación ya se usó." }

  await eliminarFactoresYSesiones(usuario.id)
  await service.from("platform_mfa_recovery_codes").delete().eq("user_id", usuario.id)
  await registrarAuditoria({
    actorId: usuario.id,
    accion: "mfa.recuperacion",
    resultado: "concedido",
    motivo: "Factor eliminado y sesiones cerradas",
  })
  await supabase.auth.signOut({ scope: "local" })
  return { ok: true }
}
