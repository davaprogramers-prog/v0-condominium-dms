/**
 * Prueba de punta a punta contra el servidor de desarrollo (http://localhost:3000).
 * Crea usuarios temporales con la clave de servicio, enrola un TOTP real y comprueba
 * 401/403/200/410, escaladas, límite de intentos y auditoría. Al terminar borra todo.
 */
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import * as OTPAuth from "otpauth"
import postgres from "postgres"
import { createClient, type Session } from "@supabase/supabase-js"

const BASE = process.env.BASE_URL ?? "http://localhost:3000"
const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!
const REF = new URL(URL_SB).hostname.split(".")[0]
const service = createClient(URL_SB, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } })
const sql = postgres(process.env.POSTGRES_URL_NON_POOLING!, { ssl: "require", max: 1, onnotice: () => {} })

const sufijo = randomUUID().slice(0, 8)
const PASS = `Prueba-${randomUUID()}`
const usuarios: string[] = []
let ok = 0
let fallas = 0

async function caso(nombre: string, fn: () => Promise<void>) {
  try {
    await fn()
    ok++
    console.log(`  ok  ${nombre}`)
  } catch (e) {
    fallas++
    console.log(`  FALLA ${nombre}: ${(e as Error).message}`)
  }
}

function cookieDeSesion(s: Session | null): string {
  if (!s) return ""
  const valor = `base64-${Buffer.from(JSON.stringify(s)).toString("base64url")}`
  const nombre = `sb-${REF}-auth-token`
  const TAM = 3180
  if (valor.length <= TAM) return `${nombre}=${valor}`
  const partes: string[] = []
  for (let i = 0; i * TAM < valor.length; i++) partes.push(`${nombre}.${i}=${valor.slice(i * TAM, (i + 1) * TAM)}`)
  return partes.join("; ")
}

async function pedir(ruta: string, s: Session | null, init: RequestInit = {}) {
  return fetch(`${BASE}${ruta}`, {
    ...init,
    redirect: "manual",
    headers: { ...(init.headers ?? {}), cookie: cookieDeSesion(s), "x-forwarded-for": `10.9.${Math.floor(Math.random() * 250)}.1` },
  })
}

async function crearUsuario(etiqueta: string) {
  const email = `prueba-sa-${etiqueta}-${sufijo}@ejemplo.invalid`
  const { data, error } = await service.auth.admin.createUser({ email, password: PASS, email_confirm: true })
  if (error || !data.user) throw new Error(`crear ${etiqueta}: ${error?.message}`)
  usuarios.push(data.user.id)
  const cliente = createClient(URL_SB, ANON, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: s, error: e } = await cliente.auth.signInWithPassword({ email, password: PASS })
  if (e || !s.session) throw new Error(`ingresar ${etiqueta}: ${e?.message}`)
  return { id: data.user.id, email, cliente, sesion: s.session }
}

async function main() {
  console.log(`super-admin-api contra ${BASE}`)
  const normal = await crearUsuario("normal")
  const sa = await crearUsuario("sa")

  await sql`insert into public.platform_super_admins (user_id, email, creado_por, motivo_alta)
            values (${sa.id}, ${sa.email}, ${sa.id}, 'Prueba automática')`

  const { data: enr, error: ee } = await sa.cliente.auth.mfa.enroll({ factorType: "totp", friendlyName: `prueba-${sufijo}` })
  if (ee || !enr) throw new Error(`enrolar: ${ee?.message}`)
  const totp = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(enr.totp.secret), digits: 6, period: 30, algorithm: "SHA1" })
  const { error: ev } = await sa.cliente.auth.mfa.challengeAndVerify({ factorId: enr.id, code: totp.generate() })
  if (ev) throw new Error(`verificar TOTP: ${ev.message}`)
  const saAal2 = (await sa.cliente.auth.getSession()).data.session!
  assert.equal(JSON.parse(Buffer.from(saAal2.access_token.split(".")[1], "base64url").toString()).aal, "aal2")
  const saAal1 = sa.sesion

  await caso("GET /api/super-admin/condos sin sesión → 401", async () => {
    assert.equal((await pedir("/api/super-admin/condos", null)).status, 401)
  })
  await caso("usuario normal → 403", async () => {
    assert.equal((await pedir("/api/super-admin/condos", normal.sesion)).status, 403)
  })
  await caso("super admin sin MFA (aal1) → 403", async () => {
    assert.equal((await pedir("/api/super-admin/condos", saAal1)).status, 403)
  })
  await caso("super admin con AAL2 → 200", async () => {
    const r = await pedir("/api/super-admin/condos", saAal2)
    assert.equal(r.status, 200)
    assert.ok(Array.isArray(await r.json()))
  })

  await caso("user_metadata.role = super_admin no eleva", async () => {
    await normal.cliente.auth.updateUser({ data: { role: "super_admin" } })
    const { data } = await normal.cliente.auth.refreshSession()
    assert.equal((await pedir("/api/super-admin/condos", data.session)).status, 403)
    assert.equal((await pedir("/api/admin/theme-permission", data.session, { method: "POST", body: "{}" })).status, 403)
  })

  await caso("RLS: el usuario no puede ponerse role super_admin en profiles", async () => {
    await service.from("profiles").upsert({ id: normal.id, email: normal.email, role: "owner" })
    const { error } = await normal.cliente.from("profiles").update({ role: "super_admin" }).eq("id", normal.id)
    const { data } = await service.from("profiles").select("role").eq("id", normal.id).single()
    assert.ok(error || data?.role !== "super_admin", "se elevó el rol")
    assert.notEqual(data?.role, "super_admin")
  })

  await caso("IDOR: no puede mover su condo_id a un condominio ajeno", async () => {
    const { data: otro } = await service.from("condominiums").select("id").limit(1).maybeSingle()
    if (!otro) return
    const { error } = await normal.cliente.from("profiles").update({ condo_id: otro.id }).eq("id", normal.id)
    const { data } = await service.from("profiles").select("condo_id").eq("id", normal.id).single()
    assert.ok(error || data?.condo_id !== otro.id, "cambió de condominio")
  })

  await caso("DELETE condominio exige motivo (pasa la guardia con AAL2 reciente)", async () => {
    const r = await pedir(`/api/super-admin/condos/${randomUUID()}`, saAal2, { method: "DELETE", body: "{}" })
    assert.equal(r.status, 400)
  })
  await caso("DELETE condominio inexistente con motivo → 404", async () => {
    const r = await pedir(`/api/super-admin/condos/${randomUUID()}`, saAal2, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ motivo: "Prueba automática" }),
    })
    assert.equal(r.status, 404)
  })
  await caso("DELETE condominio con usuario normal → 403", async () => {
    const r = await pedir(`/api/super-admin/condos/${randomUUID()}`, normal.sesion, { method: "DELETE", body: "{}" })
    assert.equal(r.status, 403)
  })

  for (const [metodo, ruta] of [
    ["POST", "/api/admin/disable-rls"],
    ["POST", "/api/admin/fix-rls"],
    ["POST", "/api/migrate"],
    ["GET", "/api/setup"],
    ["GET", "/api/setup-buckets"],
    ["GET", "/api/setup-storage"],
    ["POST", "/api/setup-themes"],
    ["GET", "/api/debug/check-profile"],
    ["GET", "/api/debug/check-properties"],
    ["GET", "/api/debug/check-properties-per-condo"],
    ["GET", "/api/fix-profiles"],
  ] as const) {
    await caso(`${metodo} ${ruta} → 410 (aun con AAL2)`, async () => {
      assert.equal((await pedir(ruta, saAal2, { method: metodo })).status, 410)
    })
  }

  await caso("/plataforma: usuario normal → 404", async () => {
    assert.equal((await pedir("/plataforma", normal.sesion)).status, 404)
  })
  await caso("/plataforma: super admin aal1 → paso de verificación, sin panel", async () => {
    const r = await pedir("/plataforma", saAal1)
    const html = await r.text()
    assert.equal(r.status, 200)
    assert.ok(html.includes("Verificación en dos pasos"))
    assert.ok(!html.includes("Secciones de plataforma"))
  })
  await caso("/plataforma: super admin AAL2 → panel", async () => {
    const r = await pedir("/plataforma", saAal2)
    assert.equal(r.status, 200)
    assert.ok((await r.text()).includes("Secciones de plataforma"))
  })
  await caso("/plataforma/auditoria: usuario normal → 404", async () => {
    assert.equal((await pedir("/plataforma/auditoria", normal.sesion)).status, 404)
  })

  await caso("límite de intentos: 5 permitidos, el 6.º espera", async () => {
    const clave = `prueba:${sufijo}`
    const r: number[] = []
    for (let i = 0; i < 6; i++) {
      const { data } = await service.rpc("fn_plataforma_consumir_intento", { p_clave: clave, p_max: 5, p_ventana_seg: 900 })
      r.push(data as number)
    }
    assert.deepEqual(r.slice(0, 5), [0, 0, 0, 0, 0])
    assert.ok(r[5] > 0)
    await service.rpc("fn_plataforma_reiniciar_intentos", { p_clave: clave })
  })
  await caso("funciones de servidor no ejecutables por usuarios", async () => {
    const { error } = await normal.cliente.rpc("fn_plataforma_cerrar_sesiones", { p_user: sa.id })
    assert.ok(error)
    const { error: e2 } = await normal.cliente.rpc("fn_plataforma_bootstrap", { p_user: normal.id, p_email: normal.email, p_ip: null })
    assert.ok(e2)
  })
  await caso("tablas de plataforma no legibles por usuarios", async () => {
    for (const t of ["platform_super_admins", "platform_audit_log", "platform_mfa_recovery_codes", "platform_rate_limits"]) {
      const { data } = await sa.cliente.from(t).select("*").limit(1)
      assert.equal((data ?? []).length, 0, t)
    }
  })
  await caso("no se puede desactivar al último super admin activo", async () => {
    const [{ n }] = await sql`select count(*)::int n from public.platform_super_admins where activo`
    if (n !== 1) return
    const { error } = await service.from("platform_super_admins").update({ activo: false }).eq("user_id", sa.id)
    assert.ok(error && /ULTIMO_SUPER_ADMIN/.test(error.message))
  })
  await caso("auditoría registra accesos denegados", async () => {
    const { count } = await service
      .from("platform_audit_log")
      .select("id", { count: "exact", head: true })
      .eq("actor_id", normal.id)
      .eq("resultado", "denegado")
    assert.ok((count ?? 0) >= 2)
  })
  await caso("sin AAL2 la BD no reconoce al super admin (is_super_admin)", async () => {
    const { data: a1 } = await createClient(URL_SB, ANON, {
      global: { headers: { Authorization: `Bearer ${saAal1.access_token}` } },
      auth: { persistSession: false },
    }).rpc("is_super_admin")
    const { data: a2 } = await createClient(URL_SB, ANON, {
      global: { headers: { Authorization: `Bearer ${saAal2.access_token}` } },
      auth: { persistSession: false },
    }).rpc("is_super_admin")
    assert.equal(a1, false)
    assert.equal(a2, true)
  })
}

async function limpiar() {
  try {
    await sql.begin(async (tx) => {
      await tx`set local session_replication_role = replica`
      await tx`delete from public.platform_super_admins where user_id = any(${usuarios}::uuid[])`
      await tx`delete from public.platform_mfa_recovery_codes where user_id = any(${usuarios}::uuid[])`
      await tx`delete from public.platform_reautenticaciones where user_id = any(${usuarios}::uuid[])`
      await tx`delete from public.platform_audit_log where actor_id = any(${usuarios}::uuid[]) or objetivo_user_id = any(${usuarios}::uuid[])`
      await tx`delete from public.platform_rate_limits where clave like ${`%${sufijo}%`} or clave like any(${usuarios.map((u) => `%${u}%`)})`
      await tx`delete from public.profiles where id = any(${usuarios}::uuid[])`
    })
    for (const id of usuarios) await service.auth.admin.deleteUser(id)
  } catch (e) {
    console.error("limpieza incompleta:", (e as Error).message)
  }
  await sql.end()
}

main()
  .catch((e) => {
    fallas++
    console.error("error:", (e as Error).message)
  })
  .finally(async () => {
    await limpiar()
    console.log(`\n${ok} ok, ${fallas} fallas`)
    process.exit(fallas ? 1 : 0)
  })
