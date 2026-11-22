/**
 * Prueba real contra la BD (scripts/152): dos condominios temporales A y B. Un administrador de A,
 * un propietario de B (vinculado solo por el correo de su casa) y un visitante anónimo intentan
 * leer y escribir fuera de lo suyo con la clave anónima. Todo lo creado se borra al final.
 * Uso: pnpm test:aislamiento-bd
 */
import assert from "node:assert/strict"
import { randomBytes, randomUUID } from "node:crypto"
import postgres from "postgres"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!
const sql = postgres(process.env.POSTGRES_URL_NON_POOLING!, { ssl: "require", max: 2, onnotice: () => {} })
const admin = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } })
const opciones = { auth: { persistSession: false, autoRefreshToken: false } }

let ok = 0
async function caso(nombre: string, fn: () => Promise<void>) {
  await fn()
  ok++
  console.log(`  ✓ ${nombre}`)
}

const usuarios: string[] = []
const condos: string[] = []

async function crearUsuario(email: string) {
  const clave = randomBytes(18).toString("base64url")
  const { data, error } = await admin.auth.admin.createUser({ email, password: clave, email_confirm: true })
  if (error) throw error
  usuarios.push(data.user!.id)
  return { id: data.user!.id, email, clave }
}

async function ingresar(email: string, clave: string): Promise<SupabaseClient> {
  const cliente = createClient(URL, ANON, opciones)
  const { error } = await cliente.auth.signInWithPassword({ email, password: clave })
  if (error) throw error
  return cliente
}

try {
  const sufijo = randomUUID().slice(0, 8)
  const adminA = await crearUsuario(`prueba-admin-a-${sufijo}@example.com`)
  const duenoB = await crearUsuario(`prueba-dueno-b-${sufijo}@example.com`)

  const [condoA] = await sql`insert into public.condominiums (name, created_by) values (${"Prueba A " + sufijo}, ${adminA.id}) returning id`
  const [condoB] = await sql`insert into public.condominiums (name, created_by) values (${"Prueba B " + sufijo}, ${adminA.id}) returning id`
  condos.push(condoA.id, condoB.id)
  const [casaA] = await sql`insert into public.houses (condo_id, house_number, owner_name) values (${condoA.id}, '1', 'Casa A') returning id`
  const [casaB] = await sql`insert into public.houses (condo_id, house_number, owner_name, owner_email)
                            values (${condoB.id}, '1', 'Casa B', ${duenoB.email}) returning id`
  await sql`insert into public.expense_types (condo_id, name) values (${condoB.id}, 'Tipo B')`

  await sql`update public.profiles set role = 'admin', condo_id = ${condoA.id} where id = ${adminA.id}`
  // El propietario de B no tiene condominio en su perfil: pertenece solo por el correo de su casa.
  await sql`update public.profiles set role = 'propietario', condo_id = null where id = ${duenoB.id}`

  const anonimo = createClient(URL, ANON, opciones)
  const clienteA = await ingresar(adminA.email, adminA.clave)
  const clienteB = await ingresar(duenoB.email, duenoB.clave)

  console.log("Visitante sin sesión:")
  await caso("no lee casas, condominios, perfiles ni pagos", async () => {
    for (const tabla of ["houses", "condominiums", "profiles", "payments", "documents", "expense_types", "condo_income"]) {
      const { data } = await anonimo.from(tabla).select("*").limit(1)
      assert.equal(data?.length ?? 0, 0, tabla)
    }
  })
  await caso("no crea casas", async () => {
    await anonimo.from("houses").insert({ condo_id: condoB.id, house_number: "99" })
    const [{ n }] = await sql`select count(*)::int n from public.houses where condo_id = ${condoB.id} and house_number = '99'`
    assert.equal(n, 0)
  })

  console.log("Administrador del condominio A:")
  await caso("solo ve las casas y el condominio A", async () => {
    const { data: casas } = await clienteA.from("houses").select("id, condo_id")
    assert.ok(casas!.length >= 1)
    assert.ok(casas!.every((c) => c.condo_id === condoA.id))
    const { data: cs } = await clienteA.from("condominiums").select("id")
    assert.deepEqual(cs!.map((c) => c.id), [condoA.id])
  })
  await caso("no ve perfiles ni tipos de gasto de B", async () => {
    const { data: perfil } = await clienteA.from("profiles").select("id").eq("id", duenoB.id)
    assert.equal(perfil?.length ?? 0, 0)
    const { data: tipos } = await clienteA.from("expense_types").select("id").eq("condo_id", condoB.id)
    assert.equal(tipos?.length ?? 0, 0)
  })
  await caso("no edita ni borra la casa de B", async () => {
    await clienteA.from("houses").update({ owner_name: "HACKEADO" }).eq("id", casaB.id)
    await clienteA.from("houses").delete().eq("id", casaB.id)
    const [casa] = await sql`select owner_name from public.houses where id = ${casaB.id}`
    assert.equal(casa?.owner_name, "Casa B")
  })
  await caso("no crea registros en B", async () => {
    const { error } = await clienteA.from("expense_types").insert({ condo_id: condoB.id, name: "Intruso" })
    assert.ok(error, "debía rechazarse")
    const [{ n }] = await sql`select count(*)::int n from public.expense_types where condo_id = ${condoB.id} and name = 'Intruso'`
    assert.equal(n, 0)
  })
  await caso("no cambia el nombre del condominio B", async () => {
    await clienteA.from("condominiums").update({ name: "HACKEADO" }).eq("id", condoB.id)
    const [c] = await sql`select name from public.condominiums where id = ${condoB.id}`
    assert.notEqual(c.name, "HACKEADO")
  })
  await caso("sí edita su propia casa (A)", async () => {
    const { error } = await clienteA.from("houses").update({ owner_name: "Casa A editada" }).eq("id", casaA.id)
    assert.equal(error, null)
    const [casa] = await sql`select owner_name from public.houses where id = ${casaA.id}`
    assert.equal(casa.owner_name, "Casa A editada")
  })

  console.log("Propietario de B (por correo de su casa):")
  await caso("ve su casa y su condominio B, no A", async () => {
    const { data: casas } = await clienteB.from("houses").select("id, condo_id")
    assert.ok(casas!.some((c) => c.id === casaB.id))
    assert.ok(casas!.every((c) => c.condo_id === condoB.id))
    const { data: cs } = await clienteB.from("condominiums").select("id")
    assert.deepEqual(cs!.map((c) => c.id), [condoB.id])
  })
  await caso("no ve el perfil del administrador de A", async () => {
    const { data } = await clienteB.from("profiles").select("id").eq("id", adminA.id)
    assert.equal(data?.length ?? 0, 0)
  })
  await caso("sigue leyendo su propio perfil", async () => {
    const { data } = await clienteB.from("profiles").select("id").eq("id", duenoB.id)
    assert.equal(data?.length, 1)
  })

  console.log(`\n${ok} casos OK`)
} finally {
  if (condos.length) {
    await sql`update public.profiles set condo_id = null where condo_id = any(${condos}::uuid[])`
    for (const t of ["expense_types", "houses"]) {
      await sql.unsafe(`delete from public.${t} where condo_id = any($1::uuid[])`, [condos])
    }
    await sql`delete from public.condominiums where id = any(${condos}::uuid[])`
  }
  for (const id of usuarios) await admin.auth.admin.deleteUser(id).catch(() => {})
  await sql.end()
}
