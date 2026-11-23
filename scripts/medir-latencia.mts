import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const service = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

const correo = process.argv[2] ?? "administracion@demo.invalid"
const { data: link, error: e1 } = await service.auth.admin.generateLink({ type: "magiclink", email: correo })
if (e1) throw e1
const usuario = createClient(url, anon, { auth: { persistSession: false } })
const { error: e2 } = await usuario.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: "magiclink" })
if (e2) throw e2

async function t(nombre: string, f: () => PromiseLike<unknown>) {
  const tiempos: number[] = []
  for (let i = 0; i < 4; i++) {
    const a = performance.now()
    await f()
    tiempos.push(Math.round(performance.now() - a))
  }
  console.log(nombre.padEnd(40), tiempos.slice(1).join(" / "), "ms")
}

const { data: perfil } = await usuario.from("profiles").select("condo_id").eq("email", correo).single()
const condo = perfil!.condo_id
await t("auth.getUser (red)", () => usuario.auth.getUser())
await t("profiles (RLS)", () => usuario.from("profiles").select("role").limit(1))
await t("houses (RLS)", () => usuario.from("houses").select("id").eq("condo_id", condo))
await t("houses (service)", () => service.from("houses").select("id").eq("condo_id", condo))
await t("condo_income (RLS)", () => usuario.from("condo_income").select("id,amount").eq("condo_id", condo))
await t("condo_income (service)", () => service.from("condo_income").select("id,amount").eq("condo_id", condo))
await t("condo_expenses (RLS)", () => usuario.from("condo_expenses").select("id,amount").eq("condo_id", condo))
await t("condo_expenses (service)", () => service.from("condo_expenses").select("id,amount").eq("condo_id", condo))
await t("payment_proofs (RLS)", () => usuario.from("payment_proofs").select("id").limit(500))
await t("payment_proofs (service)", () => service.from("payment_proofs").select("id").limit(500))
