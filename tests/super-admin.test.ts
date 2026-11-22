import { test } from "node:test"
import assert from "node:assert/strict"
import {
  decidirAccesoGlobal,
  estadoHttp,
  mfaEsReciente,
  reautenticacionVigente,
  ultimaVerificacionTotp,
} from "../lib/auth/plataforma/decision"
import { CAPACIDADES, SUPERFICIES_PLATAFORMA } from "../lib/auth/plataforma/capacidades"
import { codigoCoincide, generarCodigos, hashCodigo, normalizarCodigo, secretosIguales } from "../lib/auth/plataforma/recuperacion"

const ID = "11111111-1111-4111-8111-111111111111"
const registro = { user_id: ID, email: "sa@ejemplo.cl", activo: true }
const base = { usuarioId: ID, correoSesion: "sa@ejemplo.cl", registro, aal: "aal2" }

test("super admin con registro activo y AAL2: concedido", () => {
  assert.deepEqual(decidirAccesoGlobal(base), { concedido: true })
})

test("usuario normal o admin de condominio (sin registro): rechazado", () => {
  assert.deepEqual(decidirAccesoGlobal({ ...base, registro: null }), { concedido: false, motivo: "SIN_REGISTRO" })
})

test("super admin sin MFA (aal1): rechazado", () => {
  assert.deepEqual(decidirAccesoGlobal({ ...base, aal: "aal1" }), { concedido: false, motivo: "REQUIERE_AAL2" })
  assert.deepEqual(decidirAccesoGlobal({ ...base, aal: null }), { concedido: false, motivo: "REQUIERE_AAL2" })
})

test("registro desactivado: rechazado aunque tenga AAL2", () => {
  assert.deepEqual(decidirAccesoGlobal({ ...base, registro: { ...registro, activo: false } }), {
    concedido: false,
    motivo: "REGISTRO_INACTIVO",
  })
})

test("sesión vencida o ausente: 401", () => {
  const d = decidirAccesoGlobal({ ...base, usuarioId: null })
  assert.deepEqual(d, { concedido: false, motivo: "SIN_SESION" })
  assert.equal(estadoHttp("SIN_SESION"), 401)
  assert.equal(estadoHttp("REQUIERE_AAL2"), 403)
})

test("registro de otro usuario o correo distinto: rechazado", () => {
  assert.equal(decidirAccesoGlobal({ ...base, registro: { ...registro, user_id: "otro" } }).concedido, false)
  assert.deepEqual(decidirAccesoGlobal({ ...base, correoSesion: "otro@ejemplo.cl" }), { concedido: false, motivo: "CORREO_DISTINTO" })
  assert.equal(decidirAccesoGlobal({ ...base, correoSesion: " SA@Ejemplo.cl " }).concedido, true)
})

test("cualquier error de lectura falla cerrado", () => {
  assert.deepEqual(decidirAccesoGlobal({ ...base, error: true }), { concedido: false, motivo: "ERROR" })
})

test("metadata o localStorage no elevan: la decisión no tiene entradas para ellos", () => {
  // Un 'role: super_admin' en user_metadata/localStorage no forma parte de la entrada: sin registro, se rechaza.
  const entrada = { ...base, registro: null, user_metadata: { role: "super_admin" } } as unknown as Parameters<typeof decidirAccesoGlobal>[0]
  assert.equal(decidirAccesoGlobal(entrada).concedido, false)
})

test("factor eliminado: la sesión vuelve a aal1 y se rechaza", () => {
  assert.equal(decidirAccesoGlobal({ ...base, aal: "aal1" }).concedido, false)
})

test("MFA reciente según amr", () => {
  const ahora = 1_800_000_000
  const amr = [{ method: "password", timestamp: ahora - 5000 }, { method: "totp", timestamp: ahora - 120 }]
  assert.equal(ultimaVerificacionTotp(amr), ahora - 120)
  assert.equal(mfaEsReciente(amr, ahora, 600), true)
  assert.equal(mfaEsReciente([{ method: "totp", timestamp: ahora - 601 }], ahora, 600), false)
  assert.equal(mfaEsReciente([{ method: "password", timestamp: ahora }], ahora, 600), false)
  assert.equal(mfaEsReciente(["totp"], ahora, 600), false)
  assert.equal(mfaEsReciente(null, ahora, 600), false)
  assert.equal(mfaEsReciente([{ method: "totp", timestamp: ahora + 3600 }], ahora, 600), false)
})

test("reautenticación vigente 10 minutos", () => {
  const ahora = Date.parse("2026-11-22T12:00:00Z")
  assert.equal(reautenticacionVigente("2026-11-22T11:55:00Z", ahora, 600), true)
  assert.equal(reautenticacionVigente("2026-11-22T11:49:00Z", ahora, 600), false)
  assert.equal(reautenticacionVigente(null, ahora, 600), false)
  assert.equal(reautenticacionVigente("no-fecha", ahora, 600), false)
})

test("toda superficie declara una capacidad válida", () => {
  for (const [ruta, cap] of Object.entries(SUPERFICIES_PLATAFORMA)) {
    assert.ok((CAPACIDADES as readonly string[]).includes(cap), `${ruta} → ${cap}`)
  }
})

test("códigos de recuperación: 10 únicos, solo hash, un uso por hash", () => {
  const codigos = generarCodigos()
  assert.equal(codigos.length, 10)
  assert.equal(new Set(codigos).size, 10)
  for (const c of codigos) assert.match(c, /^[A-Z2-9]{5}-[A-Z2-9]{5}$/)
  const h = hashCodigo(codigos[0])
  assert.ok(!h.includes(normalizarCodigo(codigos[0])))
  assert.equal(codigoCoincide(codigos[0], h), true)
  assert.equal(codigoCoincide(codigos[0].toLowerCase().replace("-", " "), h), true)
  assert.equal(codigoCoincide(codigos[1], h), false)
  assert.equal(codigoCoincide(codigos[0], "malformado"), false)
})

test("secreto de bootstrap: comparación exacta", () => {
  assert.equal(secretosIguales("a".repeat(40), "a".repeat(40)), true)
  assert.equal(secretosIguales("a".repeat(40), "a".repeat(39)), false)
  assert.equal(secretosIguales("a".repeat(40), "b".repeat(40)), false)
})
