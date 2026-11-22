"use server"

import { revalidatePath } from "next/cache"
import { createClient as crearClienteSupabase } from "@supabase/supabase-js"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { evaluarRegistroSinMfa, requireGlobalSuperAdmin, type ResultadoGuardia } from "@/lib/auth/plataforma/guardia"
import { REAUTENTICACION_SEGUNDOS } from "@/lib/auth/plataforma/capacidades"
import { reautenticacionVigente } from "@/lib/auth/plataforma/decision"
import { ipSolicitud, registrarAuditoria } from "@/lib/auth/plataforma/auditoria"
import { consumirIntento, mensajeEspera, reiniciarIntentos } from "@/lib/auth/plataforma/limite"
import { generarCodigos, hashCodigo, secretosIguales } from "@/lib/auth/plataforma/recuperacion"
import { cerrarSesiones, eliminarFactoresYSesiones } from "@/lib/auth/plataforma/sesiones"

type Resultado<T = object> = ({ ok: true } & T) | { ok: false; error: string; codigo?: string }

const DENEGADO = "No tienes permiso para realizar esta acción."
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function errorGuardia(g: Extract<ResultadoGuardia, { ok: false }>): { ok: false; error: string; codigo: string } {
  if (g.motivo === "MFA_NO_RECIENTE") {
    return { ok: false, error: "Vuelve a validar tu código de verificación para continuar.", codigo: "MFA_NO_RECIENTE" }
  }
  return { ok: false, error: DENEGADO, codigo: "DENEGADO" }
}

function motivoValido(m: unknown): string | null {
  const t = typeof m === "string" ? m.trim() : ""
  return t.length >= 5 && t.length <= 300 ? t : null
}

// ---------- Reautenticación (contraseña confirmada en el servidor) ----------

export async function confirmarContrasena(password: string): Promise<Resultado> {
  const r = await evaluarRegistroSinMfa()
  if (!r.ok) return { ok: false, error: DENEGADO }
  if (!password || password.length > 200) return { ok: false, error: "Contraseña incorrecta." }

  const espera = await consumirIntento("reautenticacion", r.usuario.id)
  if (espera > 0) return { ok: false, error: mensajeEspera(espera) }

  const verificador = crearClienteSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await verificador.auth.signInWithPassword({ email: r.usuario.email!, password })
  if (error || data.user?.id !== r.usuario.id) {
    await registrarAuditoria({ actorId: r.usuario.id, accion: "reautenticacion", resultado: "denegado" })
    return { ok: false, error: "Contraseña incorrecta." }
  }
  // La sesión temporal creada para verificar no se conserva.
  await verificador.auth.signOut({ scope: "local" }).catch(() => undefined)
  if (data.session?.access_token) {
    await createServiceClient().auth.admin.signOut(data.session.access_token, "local").catch(() => undefined)
  }

  await reiniciarIntentos("reautenticacion", r.usuario.id)
  const { error: e } = await createServiceClient()
    .from("platform_reautenticaciones")
    .upsert({ user_id: r.usuario.id, confirmado_at: new Date().toISOString() })
  if (e) return { ok: false, error: "No fue posible registrar la confirmación." }
  await registrarAuditoria({ actorId: r.usuario.id, accion: "reautenticacion", resultado: "concedido" })
  return { ok: true }
}

async function reautenticacionReciente(userId: string): Promise<boolean> {
  const { data } = await createServiceClient()
    .from("platform_reautenticaciones")
    .select("confirmado_at")
    .eq("user_id", userId)
    .maybeSingle()
  return reautenticacionVigente(data?.confirmado_at, Date.now(), REAUTENTICACION_SEGUNDOS)
}

// ---------- Enrolamiento TOTP ----------

export async function iniciarEnrolamiento(): Promise<Resultado<{ factorId: string; qr: string; secreto: string }>> {
  const r = await evaluarRegistroSinMfa()
  if (!r.ok) return { ok: false, error: DENEGADO }
  if (!(await reautenticacionReciente(r.usuario.id))) {
    return { ok: false, error: "Confirma tu contraseña para continuar.", codigo: "REAUTENTICAR" }
  }

  const { data: factores, error: ef } = await r.supabase.auth.mfa.listFactors()
  if (ef) return { ok: false, error: "No fue posible leer tus factores." }
  if (factores.totp.some((f) => f.status === "verified")) {
    return { ok: false, error: "Ya tienes un factor activo. Quítalo antes de configurar otro." }
  }
  for (const f of factores.all.filter((f) => f.status === "unverified")) {
    await r.supabase.auth.mfa.unenroll({ factorId: f.id })
  }

  const { data, error } = await r.supabase.auth.mfa.enroll({
    factorType: "totp",
    issuer: "InteliCon Plataforma",
    friendlyName: `Plataforma ${new Date().toISOString().slice(0, 10)}`,
  })
  if (error || !data) return { ok: false, error: "No fue posible iniciar la configuración." }
  await registrarAuditoria({ actorId: r.usuario.id, accion: "mfa.enrolar_inicio", resultado: "concedido" })
  return { ok: true, factorId: data.id, qr: data.totp.qr_code, secreto: data.totp.secret }
}

async function guardarCodigosNuevos(userId: string): Promise<string[] | null> {
  const service = createServiceClient()
  const codigos = generarCodigos()
  const { error: eb } = await service.from("platform_mfa_recovery_codes").delete().eq("user_id", userId)
  if (eb) return null
  const { error } = await service
    .from("platform_mfa_recovery_codes")
    .insert(codigos.map((c) => ({ user_id: userId, code_hash: hashCodigo(c) })))
  return error ? null : codigos
}

export async function verificarEnrolamiento(factorId: string, codigo: string): Promise<Resultado<{ codigos: string[] }>> {
  const r = await evaluarRegistroSinMfa()
  if (!r.ok) return { ok: false, error: DENEGADO }
  if (!UUID.test(factorId) || !/^\d{6}$/.test(codigo)) return { ok: false, error: "Ingresa los 6 dígitos del código." }

  const espera = await consumirIntento("totp", r.usuario.id)
  if (espera > 0) return { ok: false, error: mensajeEspera(espera) }

  const { error } = await r.supabase.auth.mfa.challengeAndVerify({ factorId, code: codigo })
  if (error) {
    await registrarAuditoria({ actorId: r.usuario.id, accion: "mfa.enrolar", resultado: "denegado", motivo: "Código inválido" })
    return { ok: false, error: "El código no es válido. Revisa la hora de tu teléfono e intenta de nuevo." }
  }
  await reiniciarIntentos("totp", r.usuario.id)

  const codigos = await guardarCodigosNuevos(r.usuario.id)
  if (!codigos) return { ok: false, error: "El factor quedó activo, pero no se pudieron crear los códigos de recuperación. Genéralos de nuevo." }
  await registrarAuditoria({ actorId: r.usuario.id, accion: "mfa.enrolar", resultado: "concedido" })
  revalidatePath("/plataforma", "layout")
  return { ok: true, codigos }
}

/** Vuelve a validar el código para operaciones que exigen MFA reciente. */
export async function revalidarMfa(codigo: string): Promise<Resultado> {
  const supabase = await createClient()
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) return { ok: false, error: DENEGADO }
  if (!/^\d{6}$/.test(codigo)) return { ok: false, error: "Ingresa los 6 dígitos del código." }
  const espera = await consumirIntento("totp", u.user.id)
  if (espera > 0) return { ok: false, error: mensajeEspera(espera) }

  const { data: factores } = await supabase.auth.mfa.listFactors()
  const factor = factores?.totp.find((f) => f.status === "verified")
  if (!factor) return { ok: false, error: "No tienes un factor activo." }
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: codigo })
  if (error) {
    await registrarAuditoria({ actorId: u.user.id, accion: "mfa.revalidar", resultado: "denegado" })
    return { ok: false, error: "El código no es válido o ya venció." }
  }
  await reiniciarIntentos("totp", u.user.id)
  await registrarAuditoria({ actorId: u.user.id, accion: "mfa.revalidar", resultado: "concedido" })
  return { ok: true }
}

export async function regenerarCodigos(): Promise<Resultado<{ codigos: string[] }>> {
  const g = await requireGlobalSuperAdmin("seguridad.gestionar", { accionMfaReciente: "mfa.regenerar_codigos" })
  if (!g.ok) return errorGuardia(g)
  const codigos = await guardarCodigosNuevos(g.usuario.id)
  if (!codigos) return { ok: false, error: "No se pudieron generar los códigos." }
  await registrarAuditoria({ actorId: g.usuario.id, accion: "mfa.regenerar_codigos", resultado: "concedido" })
  return { ok: true, codigos }
}

export async function quitarFactor(motivo: string): Promise<Resultado> {
  const g = await requireGlobalSuperAdmin("seguridad.gestionar", { accionMfaReciente: "mfa.quitar_factor" })
  if (!g.ok) return errorGuardia(g)
  const m = motivoValido(motivo)
  if (!m) return { ok: false, error: "Indica el motivo (mínimo 5 caracteres)." }
  try {
    await eliminarFactoresYSesiones(g.usuario.id)
    await createServiceClient().from("platform_mfa_recovery_codes").delete().eq("user_id", g.usuario.id)
  } catch {
    await registrarAuditoria({ actorId: g.usuario.id, accion: "mfa.quitar_factor", resultado: "error", motivo: m })
    return { ok: false, error: "No fue posible quitar el factor." }
  }
  await registrarAuditoria({ actorId: g.usuario.id, accion: "mfa.quitar_factor", resultado: "concedido", motivo: m })
  await g.supabase.auth.signOut({ scope: "local" }).catch(() => undefined)
  return { ok: true }
}

export async function cerrarTodasLasSesiones(): Promise<Resultado<{ cerradas: number }>> {
  const g = await requireGlobalSuperAdmin("seguridad.gestionar", { accionMfaReciente: "sesiones.cerrar_todas" })
  if (!g.ok) return errorGuardia(g)
  try {
    const cerradas = await cerrarSesiones(g.usuario.id)
    await registrarAuditoria({ actorId: g.usuario.id, accion: "sesiones.cerrar_todas", resultado: "concedido" })
    await g.supabase.auth.signOut({ scope: "local" }).catch(() => undefined)
    return { ok: true, cerradas }
  } catch {
    return { ok: false, error: "No fue posible cerrar las sesiones." }
  }
}

// ---------- Operación dentro de un condominio ----------

export async function entrarACondominio(condoId: string): Promise<Resultado> {
  if (!UUID.test(condoId)) return { ok: false, error: "Condominio inválido." }
  const g = await requireGlobalSuperAdmin("condominio.operar", { condoId })
  if (!g.ok) return errorGuardia(g)

  const service = createServiceClient()
  const { data: condo } = await service.from("condominiums").select("id").eq("id", condoId).maybeSingle()
  if (!condo) return { ok: false, error: "Condominio no encontrado." }

  const { error } = await service.from("profiles").update({ condo_id: condoId }).eq("id", g.usuario.id)
  if (error) return { ok: false, error: "No fue posible ingresar al condominio." }
  await registrarAuditoria({ actorId: g.usuario.id, accion: "acceso_condominio", resultado: "concedido", condoId })
  revalidatePath("/dashboard", "layout")
  return { ok: true }
}

// ---------- Bootstrap (una sola vez) ----------

export async function ejecutarBootstrap(token: string): Promise<Resultado> {
  const supabase = await createClient()
  const { data: u } = await supabase.auth.getUser()
  if (!u.user?.email) return { ok: false, error: "Inicia sesión para continuar." }

  const espera = await consumirIntento("bootstrap", u.user.id)
  if (espera > 0) return { ok: false, error: mensajeEspera(espera) }

  const esperado = process.env.SUPER_ADMIN_BOOTSTRAP_TOKEN ?? ""
  const entregado = typeof token === "string" ? token.trim() : ""
  if (esperado.length < 32 || !entregado || !secretosIguales(entregado, esperado)) {
    await registrarAuditoria({ actorId: u.user.id, accion: "bootstrap", resultado: "denegado", motivo: "Secreto inválido" })
    return { ok: false, error: "El secreto no es válido o el alta inicial no está disponible." }
  }

  const { error } = await createServiceClient().rpc("fn_plataforma_bootstrap", {
    p_user: u.user.id,
    p_email: u.user.email,
    p_ip: await ipSolicitud(),
  })
  if (error) {
    await registrarAuditoria({ actorId: u.user.id, accion: "bootstrap", resultado: "denegado", motivo: "Ya utilizado" })
    return { ok: false, error: "El secreto no es válido o el alta inicial no está disponible." }
  }
  revalidatePath("/plataforma", "layout")
  return { ok: true }
}

// ---------- Alta y revocación de super administradores ----------

export async function altaSuperAdmin(emailEntrada: string, motivo: string): Promise<Resultado> {
  const g = await requireGlobalSuperAdmin("super_admins.gestionar", { accionMfaReciente: "super_admin.alta" })
  if (!g.ok) return errorGuardia(g)
  const m = motivoValido(motivo)
  const email = typeof emailEntrada === "string" ? emailEntrada.trim().toLowerCase() : ""
  if (!m) return { ok: false, error: "Indica el motivo (mínimo 5 caracteres)." }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Correo inválido." }

  const service = createServiceClient()
  const { data: perfil } = await service.from("profiles").select("id, email").ilike("email", email).maybeSingle()
  let userId = perfil?.id as string | undefined
  if (userId) {
    const { data: au } = await service.auth.admin.getUserById(userId)
    if (au.user?.email?.toLowerCase() !== email) userId = undefined
  }
  if (!userId) return { ok: false, error: "No existe una cuenta confirmada con ese correo. La persona debe registrarse primero." }

  const { error } = await service.from("platform_super_admins").upsert({
    user_id: userId,
    email,
    activo: true,
    creado_por: g.usuario.id,
    creado_at: new Date().toISOString(),
    motivo_alta: m,
    desactivado_por: null,
    desactivado_at: null,
    motivo_baja: null,
  })
  if (error) return { ok: false, error: "No fue posible dar de alta al super administrador." }
  await registrarAuditoria({ actorId: g.usuario.id, accion: "super_admin.alta", resultado: "concedido", objetivoUserId: userId, motivo: m })
  revalidatePath("/plataforma/super-admins")
  return { ok: true }
}

export async function desactivarSuperAdmin(userId: string, motivo: string): Promise<Resultado> {
  const g = await requireGlobalSuperAdmin("super_admins.gestionar", { accionMfaReciente: "super_admin.desactivar" })
  if (!g.ok) return errorGuardia(g)
  const m = motivoValido(motivo)
  if (!m) return { ok: false, error: "Indica el motivo (mínimo 5 caracteres)." }
  if (!UUID.test(userId)) return { ok: false, error: "Usuario inválido." }

  const service = createServiceClient()
  const { data, error } = await service
    .from("platform_super_admins")
    .update({ activo: false, desactivado_por: g.usuario.id, desactivado_at: new Date().toISOString(), motivo_baja: m })
    .eq("user_id", userId)
    .eq("activo", true)
    .select("user_id")
  if (error) {
    const ultimo = /ULTIMO_SUPER_ADMIN/.test(error.message)
    return { ok: false, error: ultimo ? "No puedes desactivar al último super administrador activo." : "No fue posible desactivarlo." }
  }
  if (!data || data.length === 0) return { ok: false, error: "Ese super administrador no está activo." }

  try {
    await eliminarFactoresYSesiones(userId)
    await service.from("platform_mfa_recovery_codes").delete().eq("user_id", userId)
  } catch {
    await registrarAuditoria({ actorId: g.usuario.id, accion: "super_admin.desactivar", resultado: "error", objetivoUserId: userId, motivo: "Factores o sesiones no eliminados" })
  }
  await registrarAuditoria({ actorId: g.usuario.id, accion: "super_admin.desactivar", resultado: "concedido", objetivoUserId: userId, motivo: m })
  revalidatePath("/plataforma/super-admins")
  return { ok: true }
}
