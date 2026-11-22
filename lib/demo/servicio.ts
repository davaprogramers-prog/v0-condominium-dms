import { cookies } from "next/headers"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { opcionesCookieSesion } from "@/lib/supabase/opciones-cookie"
import { ipSolicitud } from "@/lib/auth/plataforma/auditoria"
import { consumirIntento } from "@/lib/auth/plataforma/limite"
import {
  COOKIE_REANUDAR,
  MENSAJE_NO_DISPONIBLE,
  MENSAJE_SESION_ABIERTA,
  ROLES_DEMO,
  type RolDemo,
  type RolDemoInterno,
  claveTemporal,
  correoDemo,
  esUsuarioDemo,
  generarToken,
  hashToken,
  huellaIp,
  tokenConFormatoValido,
} from "./reglas"

export type ResultadoDemo = { ok: true; destino: string } | { ok: false; error: string }

type Asignacion = { userId: string; condoId: string | null; houseId: string | null; expira: string }

function secretoHuella(): string {
  return process.env.SUPABASE_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ""
}

async function guardarCookieReanudar(token: string, expira: string) {
  const almacen = await cookies()
  almacen.set(COOKIE_REANUDAR, token, {
    httpOnly: true,
    ...opcionesCookieSesion,
    path: "/",
    expires: new Date(expira),
  })
}

export async function borrarCookieReanudar() {
  const almacen = await cookies()
  almacen.delete(COOKIE_REANUDAR)
}

/** Intenta reanudar la identidad de la cookie. Si era de otro rol, la libera. */
async function reanudar(rol: RolDemoInterno, nuevoHash: string): Promise<Asignacion | null> {
  const almacen = await cookies()
  const token = almacen.get(COOKIE_REANUDAR)?.value
  if (!tokenConFormatoValido(token)) return null

  const service = createServiceClient()
  const { data, error } = await service.rpc("fn_demo_reanudar", {
    p_token_hash: hashToken(token),
    p_rol: rol,
    p_nuevo_hash: nuevoHash,
  })
  const fila = Array.isArray(data) ? data[0] : null
  if (error || !fila) return null

  if (fila.resultado === "otro_rol" && fila.user_id) {
    await service.rpc("fn_demo_liberar", { p_user: fila.user_id })
    return null
  }
  if (fila.resultado !== "reanudada" || !fila.user_id) return null

  const { data: perfil } = await service
    .from("profiles")
    .select("condo_id, house_id")
    .eq("id", fila.user_id)
    .maybeSingle()
  return { userId: fila.user_id, condoId: perfil?.condo_id ?? null, houseId: perfil?.house_id ?? null, expira: fila.expira_at }
}

async function reservar(rol: RolDemoInterno, nuevoHash: string, huella: string): Promise<Asignacion | null> {
  const service = createServiceClient()
  const { data, error } = await service.rpc("fn_demo_reservar", {
    p_rol: rol,
    p_huella: huella,
    p_token_hash: nuevoHash,
  })
  const fila = Array.isArray(data) ? data[0] : null
  if (error || !fila) {
    if (error) console.error("[demo] reserva fallida:", error.message)
    return null
  }

  if (fila.resultado === "reciclada" && fila.user_id) {
    return { userId: fila.user_id, condoId: fila.condo_id, houseId: fila.house_id, expira: fila.expira_at }
  }
  if (fila.resultado !== "crear" || !fila.identidad_id) return null

  let userId: string | null = null
  try {
    const { data: creado, error: errorAlta } = await service.auth.admin.createUser({
      email: correoDemo(fila.identidad_id),
      password: claveTemporal(),
      email_confirm: true,
      app_metadata: { demo: true, role: rol, condo_id: fila.condo_id },
      user_metadata: { first_name: "Visitante", last_name: "Demo" },
    })
    if (errorAlta || !creado.user) throw new Error(errorAlta?.message ?? "Alta sin usuario")
    userId = creado.user.id

    const { data: activada, error: errorActivar } = await service.rpc("fn_demo_activar", {
      p_identidad: fila.identidad_id,
      p_user: userId,
    })
    if (errorActivar || activada !== true) throw new Error(errorActivar?.message ?? "Reserva vencida")
    return { userId, condoId: fila.condo_id, houseId: fila.house_id, expira: fila.expira_at }
  } catch (err) {
    console.error("[demo] alta de identidad fallida:", (err as Error).message)
    await service.rpc("fn_demo_descartar", { p_identidad: fila.identidad_id })
    if (userId) await service.auth.admin.deleteUser(userId)
    return null
  }
}

/** Deja el perfil en su estado demo, fija una clave nueva de un solo uso e inicia la sesión con cookies. */
async function abrirSesion(rol: RolDemoInterno, asignacion: Asignacion): Promise<boolean> {
  const service = createServiceClient()
  const clave = claveTemporal()
  const { data: actualizado, error } = await service.auth.admin.updateUserById(asignacion.userId, {
    password: clave,
    app_metadata: { demo: true, role: rol, condo_id: asignacion.condoId, demo_expira: asignacion.expira },
  })
  if (error || !actualizado.user?.email) {
    console.error("[demo] no se pudo preparar la identidad:", error?.message)
    return false
  }

  const { error: errorPerfil } = await service.from("profiles").upsert({
    id: asignacion.userId,
    email: actualizado.user.email,
    role: rol,
    condo_id: asignacion.condoId,
    house_id: rol === "propietario" ? asignacion.houseId : null,
    first_name: "Visitante",
    last_name: `Demo (${Object.values(ROLES_DEMO).find((r) => r.interno === rol)?.etiqueta ?? rol})`,
  })
  if (errorPerfil) {
    console.error("[demo] perfil no preparado:", errorPerfil.message)
    return false
  }

  // Ninguna sesión anterior de esta identidad sobrevive a una nueva asignación.
  await service.rpc("fn_plataforma_cerrar_sesiones", { p_user: asignacion.userId })

  const supabase = await createClient()
  const { error: errorIngreso } = await supabase.auth.signInWithPassword({ email: actualizado.user.email, password: clave })
  if (errorIngreso) {
    console.error("[demo] ingreso fallido:", errorIngreso.message)
    return false
  }
  return true
}

export async function iniciarSesionDemo(rolPublico: RolDemo): Promise<ResultadoDemo> {
  const rol = ROLES_DEMO[rolPublico].interno

  const supabase = await createClient()
  const { data: actual } = await supabase.auth.getUser()
  if (actual.user && !esUsuarioDemo(actual.user)) return { ok: false, error: MENSAJE_SESION_ABIERTA }

  const ip = (await ipSolicitud()) ?? "sin-ip"
  const secreto = secretoHuella()
  if (!secreto) return { ok: false, error: MENSAJE_NO_DISPONIBLE }
  const huella = huellaIp(ip, secreto)

  const espera = await consumirIntento("demo", huella)
  if (espera > 0) return { ok: false, error: MENSAJE_NO_DISPONIBLE }

  const nuevoToken = generarToken()
  const nuevoHash = hashToken(nuevoToken)

  let asignacion = await reanudar(rol, nuevoHash)
  if (!asignacion) {
    if (actual.user) {
      // Sesión demo de otro rol en este navegador: se cierra antes de abrir la nueva.
      await createServiceClient().rpc("fn_demo_liberar", { p_user: actual.user.id })
      await supabase.auth.signOut({ scope: "local" })
    }
    asignacion = await reservar(rol, nuevoHash, huella)
  }
  if (!asignacion) return { ok: false, error: MENSAJE_NO_DISPONIBLE }

  if (!(await abrirSesion(rol, asignacion))) {
    await createServiceClient().rpc("fn_demo_liberar", { p_user: asignacion.userId })
    return { ok: false, error: MENSAJE_NO_DISPONIBLE }
  }
  await guardarCookieReanudar(nuevoToken, asignacion.expira)
  return { ok: true, destino: "/dashboard" }
}

export async function cerrarSesionDemo(): Promise<void> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (data.user && esUsuarioDemo(data.user)) {
    await supabase.auth.signOut({ scope: "local" })
    await createServiceClient().rpc("fn_demo_liberar", { p_user: data.user.id })
  }
  await borrarCookieReanudar()
}
