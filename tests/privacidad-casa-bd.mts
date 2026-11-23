// Residente demo con sesión real: solo ve comprobantes, encomiendas y visitas de su casa y no modifica ingresos ajenos.
// Requiere haber corrido pnpm demo:poblar y una identidad demo de residente activa (o la crea vía magic link de vecino01).
import assert from "node:assert/strict"
import postgres from "postgres"
import { createClient } from "@supabase/supabase-js"

const sql = postgres(process.env.POSTGRES_URL_NON_POOLING!, { ssl: "require", max: 1, onnotice: () => {} })
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const admin = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

async function sesion(email: string) {
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email })
  if (error) throw error
  const cliente = createClient(URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
  const r = await cliente.auth.verifyOtp({ token_hash: data.properties.hashed_token, type: "magiclink" })
  if (r.error) throw r.error
  return cliente
}

let ok = 0
try {
  const [vecino] = await sql`select p.house_id from public.profiles p where p.email = 'vecino03@demo.invalid'`
  assert.ok(vecino?.house_id, "falta vecino03 (correr pnpm demo:poblar)")
  const residente = await sesion("vecino03@demo.invalid")
  for (const tabla of ["payment_proofs", "parcels", "visits"]) {
    const { data, error } = await residente.from(tabla).select("house_id")
    assert.equal(error, null)
    assert.ok(data!.length > 0, `${tabla}: el residente debe ver lo suyo`)
    assert.deepEqual([...new Set(data!.map((f) => f.house_id))], [vecino.house_id], `${tabla}: solo su casa`)
    console.log(`  ✓ ${tabla}: ${data!.length} filas, solo su casa`)
    ok++
  }
  const { data: cambiadas } = await residente.from("condo_income").update({ amount: 1 }).neq("house_id", vecino.house_id).select("id")
  assert.equal(cambiadas?.length ?? 0, 0)
  console.log("  ✓ no puede modificar ingresos de otras casas"); ok++

  const { data: ajena } = await residente.from("visits").insert({
    condo_id: (await sql`select id from public.condominiums where es_demo`)[0].id,
    house_id: (await sql`select id from public.houses where condo_id = (select id from public.condominiums where es_demo) and id <> ${vecino.house_id} limit 1`)[0].id,
    visitor_name: "Prueba", visit_title: "Prueba", visit_date: "2026-11-22",
  }).select("id")
  assert.equal(ajena?.length ?? 0, 0)
  console.log("  ✓ no puede registrar visitas para otra casa"); ok++

  const conserje = await sesion("conserje1@demo.invalid")
  const { data: todas } = await conserje.from("parcels").select("house_id")
  assert.ok(new Set(todas!.map((f) => f.house_id)).size > 1)
  console.log("  ✓ el conserje sigue viendo encomiendas de todas las casas"); ok++
  console.log(`\n${ok} casos OK`)
} finally {
  await sql.end()
}
