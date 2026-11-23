/**
 * Prueba real contra la BD: un visitante demo inicia sesión con la clave anónima e intenta
 * salirse de su condominio. También prueba el límite por IP con reservas simultáneas.
 * Todo lo que crea se borra al final. Uso: pnpm test:demo-bd
 */
import assert from "node:assert/strict"
import { randomBytes, randomUUID, createHash } from "node:crypto"
import postgres from "postgres"
import { createClient } from "@supabase/supabase-js"

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!
const sql = postgres(process.env.POSTGRES_URL_NON_POOLING!, { ssl: "require", max: 14, onnotice: () => {} })
const admin = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } })

const hex = () => createHash("sha256").update(randomBytes(16)).digest("hex")
let ok = 0
async function caso(nombre: string, fn: () => Promise<void>) {
  await fn()
  ok++
  console.log(`  ✓ ${nombre}`)
}

const creados: string[] = []
const huellaPrueba = hex()

try {
  const [demo] = await sql`select id from public.condominiums where es_demo`
  assert.ok(demo, "Falta el condominio demo (aplicar scripts/151)")
  const [real] = await sql`select c.id from public.condominiums c where not c.es_demo
    and exists (select 1 from public.houses h where h.condo_id = c.id) limit 1`
  assert.ok(real, "Se necesita al menos un condominio real con casas")
  const [casaReal] = await sql`select id, owner_name from public.houses where condo_id = ${real.id} limit 1`
  const [casaDemo] = await sql`select id from public.houses where condo_id = ${demo.id} limit 1`
  const [{ n: casasDemo }] = await sql`select count(*)::int n from public.houses where condo_id = ${demo.id}`

  // Identidad demo de administrador, igual a la que crea el servicio.
  const clave = randomBytes(24).toString("base64url")
  const { data: alta, error } = await admin.auth.admin.createUser({
    email: `demo-prueba-${randomUUID()}@demo.invalid`,
    password: clave,
    email_confirm: true,
    app_metadata: { demo: true, role: "admin", condo_id: demo.id },
  })
  if (error) throw error
  const userId = alta.user!.id
  creados.push(userId)
  await sql`update public.profiles set role = 'admin', condo_id = ${demo.id} where id = ${userId}`
  await sql`insert into public.demo_identidades (user_id, condo_id, rol, estado, token_hash, asignada_at, expira_at)
            values (${userId}, ${demo.id}, 'admin', 'activa', ${hex()}, now(), now() + interval '1 hour')`

  const visitante = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error: errIngreso } = await visitante.auth.signInWithPassword({ email: alta.user!.email!, password: clave })
  if (errIngreso) throw errIngreso

  console.log("Aislamiento del visitante demo (administrador):")
  await caso("solo ve las casas del condominio demo", async () => {
    const { data, error } = await visitante.from("houses").select("id, condo_id")
    assert.equal(error, null)
    assert.equal(data!.length, casasDemo)
    assert.ok(data!.every((h) => h.condo_id === demo.id))
  })
  await caso("solo ve el condominio demo", async () => {
    const { data } = await visitante.from("condominiums").select("id")
    assert.deepEqual(data!.map((c) => c.id), [demo.id])
  })
  await caso("no lee pagos, perfiles ni documentos de otros condominios", async () => {
    for (const tabla of ["payments", "condo_income", "documents", "parcels", "rentals"]) {
      const { data } = await visitante.from(tabla).select("condo_id").neq("condo_id", demo.id).limit(1)
      assert.equal(data?.length ?? 0, 0, tabla)
    }
    const { data: perfiles } = await visitante.from("profiles").select("id, condo_id")
    assert.ok(perfiles!.every((p) => p.condo_id === demo.id || p.id === userId))
  })
  await caso("no modifica una casa real", async () => {
    await visitante.from("houses").update({ owner_name: "HACKEADO" }).eq("id", casaReal.id)
    const [despues] = await sql`select owner_name from public.houses where id = ${casaReal.id}`
    assert.equal(despues.owner_name, casaReal.owner_name)
  })
  await caso("no inserta en un condominio real", async () => {
    const { error } = await visitante.from("alerts").insert({ condo_id: real.id, title: "x", message: "x" })
    assert.ok(error)
  })
  await caso("no borra ni en su propio condominio", async () => {
    await visitante.from("houses").delete().eq("id", casaDemo.id)
    const [sigue] = await sql`select 1 from public.houses where id = ${casaDemo.id}`
    assert.ok(sigue)
  })
  await caso("no cambia configuración sensible ni el condominio", async () => {
    await visitante.from("parameters").update({ late_fee_percentage: 99 }).eq("condo_id", demo.id)
    const [p] = await sql`select late_fee_percentage from public.parameters where condo_id = ${demo.id}`
    assert.notEqual(Number(p.late_fee_percentage), 99)
    await visitante.from("condominiums").update({ name: "x" }).eq("id", demo.id)
    const [c] = await sql`select name from public.condominiums where id = ${demo.id}`
    assert.notEqual(c.name, "x")
  })
  await caso("no vincula correos reales a una casa demo", async () => {
    await visitante.from("houses").update({ owner_email: "victima@gmail.com" }).eq("id", casaDemo.id)
    const [c] = await sql`select owner_email from public.houses where id = ${casaDemo.id}`
    assert.notEqual(c.owner_email, "victima@gmail.com")
  })
  await caso("no puede escalar su rol ni cambiarse de condominio", async () => {
    await visitante.from("profiles").update({ role: "super_admin" }).eq("id", userId)
    await visitante.from("profiles").update({ condo_id: real.id }).eq("id", userId)
    const [p] = await sql`select role, condo_id from public.profiles where id = ${userId}`
    assert.equal(p.role, "admin")
    assert.equal(p.condo_id, demo.id)
  })
  await caso("no ejecuta las funciones de reserva", async () => {
    const { error } = await visitante.rpc("fn_demo_reservar", { p_rol: "admin", p_huella: hex(), p_token_hash: hex() })
    assert.ok(error)
    const { data } = await visitante.from("demo_identidades").select("id")
    assert.equal(data?.length ?? 0, 0)
  })
  await caso("puede trabajar dentro de la demo (crear un aviso)", async () => {
    const { error } = await visitante.from("alerts").insert({ condo_id: demo.id, title: "Prueba demo", message: "ok", created_by: userId })
    assert.equal(error, null)
  })
  console.log("Edición en la demo (solo lo propio y del mismo día):")
  let avisoPropio = ""
  await caso("edita un aviso que creó hoy", async () => {
    const { data, error } = await visitante
      .from("alerts")
      .insert({ condo_id: demo.id, title: "Editable", message: "ok", created_by: userId })
      .select("id")
      .single()
    assert.equal(error, null)
    avisoPropio = data!.id
    const [reg] = await sql`select 1 from public.demo_filas_creadas where tabla = 'alerts' and fila_id = ${avisoPropio} and user_id = ${userId}`
    assert.ok(reg, "el disparador registra la fila creada por la demo")
    await visitante.from("alerts").update({ title: "Editado hoy" }).eq("id", avisoPropio)
    const [a] = await sql`select title from public.alerts where id = ${avisoPropio}`
    assert.equal(a.title, "Editado hoy")
  })
  await caso("no elimina ni lo que creó hoy", async () => {
    await visitante.from("alerts").delete().eq("id", avisoPropio)
    const [sigue] = await sql`select 1 from public.alerts where id = ${avisoPropio}`
    assert.ok(sigue)
  })
  await caso("no edita lo propio de un día anterior", async () => {
    await sql`update public.alerts set created_at = now() - interval '1 day' where id = ${avisoPropio}`
    await sql`update public.demo_filas_creadas set creado_at = now() - interval '1 day' where fila_id = ${avisoPropio}`
    await visitante.from("alerts").update({ title: "Editado ayer" }).eq("id", avisoPropio)
    const [a] = await sql`select title from public.alerts where id = ${avisoPropio}`
    assert.equal(a.title, "Editado hoy")
  })
  await caso("no edita registros de otros (reserva, aviso, casa)", async () => {
    const [reserva] = await sql`select id, notes from public.area_reservations
      where condo_id = ${demo.id} and created_by is distinct from ${userId} limit 1`
    if (reserva) {
      await visitante.from("area_reservations").update({ notes: "MODIFICADA POR DEMO", status: "rejected" }).eq("id", reserva.id)
      const [r] = await sql`select notes from public.area_reservations where id = ${reserva.id}`
      assert.equal(r.notes, reserva.notes)
    }
    const [casa] = await sql`select owner_name from public.houses where id = ${casaDemo.id}`
    await visitante.from("houses").update({ owner_name: "Cambio demo" }).eq("id", casaDemo.id)
    const [c] = await sql`select owner_name from public.houses where id = ${casaDemo.id}`
    assert.equal(c.owner_name, casa.owner_name)
  })
  await caso("no consulta la regla con otro usuario", async () => {
    const { error } = await visitante.rpc("fn_demo_puede_editar_usuario", { p_tabla: "alerts", p_id: avisoPropio, p_user: userId })
    assert.ok(error)
  })
  await caso("la regla del servidor coincide (clave de servicio)", async () => {
    const { data: ajeno } = await admin.rpc("fn_demo_puede_editar_usuario", { p_tabla: "alerts", p_id: avisoPropio, p_user: userId })
    assert.equal(ajeno, false)
    await sql`update public.alerts set created_at = now() where id = ${avisoPropio}`
    const { data: propio } = await admin.rpc("fn_demo_puede_editar_usuario", { p_tabla: "alerts", p_id: avisoPropio, p_user: userId })
    assert.equal(propio, true)
  })

  await caso("al vencer pierde el acceso aunque el JWT siga vigente", async () => {
    await sql`update public.demo_identidades set expira_at = now() - interval '1 second' where user_id = ${userId}`
    const { data } = await visitante.from("houses").select("id")
    assert.equal(data?.length ?? 0, 0)
    const [r] = await sql`select public.fn_demo_tocar(${userId}) v`
    assert.equal(r.v, null)
    const [s] = await sql`select count(*)::int n from auth.sessions where user_id = ${userId}`
    assert.equal(s.n, 0)
  })

  console.log("Usuarios reales no cambian:")
  await caso("un usuario no demo conserva su visibilidad", async () => {
    const [otro] = await sql`select id from public.profiles where role = 'admin' and condo_id = ${real.id} limit 1`
    if (!otro) return
    const filas = await sql.begin(async (tx) => {
      await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: otro.id, role: "authenticated" })}, true)`
      await tx`set local role authenticated`
      return tx`select count(*)::int n from public.houses where condo_id = ${real.id}`
    })
    assert.ok(filas[0].n > 0)
  })

  console.log("Límites concurrentes:")
  await caso("12 reservas simultáneas desde una IP: exactamente 10 nuevas", async () => {
    const resultados = await Promise.all(
      Array.from({ length: 12 }, () =>
        sql`select resultado, identidad_id from public.fn_demo_reservar('conserje', ${huellaPrueba}, ${hex()})`,
      ),
    )
    const tipos = resultados.map((r) => r[0].resultado)
    assert.equal(tipos.filter((t) => t === "crear").length, 10, tipos.join(","))
    assert.equal(tipos.filter((t) => t === "limite_ip").length, 2)
  })
  await caso("parámetros inválidos se rechazan", async () => {
    await assert.rejects(sql`select * from public.fn_demo_reservar('super_admin', ${hex()}, ${hex()})`)
    await assert.rejects(sql`select * from public.fn_demo_reservar('admin', '192.168.0.1', ${hex()})`)
  })

  console.log(`\n${ok} casos OK`)
} catch (err) {
  console.error("\nFALLÓ:", err)
  process.exitCode = 1
} finally {
  await sql`delete from public.demo_identidades d using public.demo_eventos e
            where e.identidad_id = d.id and e.huella_ip = ${huellaPrueba} and d.estado = 'pendiente'`
  await sql`delete from public.demo_eventos where huella_ip = ${huellaPrueba}`
  for (const id of creados) {
    await sql`delete from public.alerts where created_by = ${id}`
    await admin.auth.admin.deleteUser(id)
  }
  await sql.end()
}
