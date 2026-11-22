import { test } from "node:test"
import assert from "node:assert/strict"
import {
  ROLES_DEMO,
  correoDemo,
  esRolDemo,
  esUsuarioDemo,
  etiquetaRolInterno,
  generarToken,
  hashToken,
  huellaIp,
  tokenConFormatoValido,
} from "../lib/demo/reglas"

test("solo acepta los tres roles públicos", () => {
  assert.equal(esRolDemo("administrador"), true)
  assert.equal(esRolDemo("conserje"), true)
  assert.equal(esRolDemo("residente"), true)
  for (const malo of ["admin", "super_admin", "propietario", "", null, 1, "__proto__", "toString"]) {
    assert.equal(esRolDemo(malo), false, String(malo))
  }
  assert.deepEqual(Object.values(ROLES_DEMO).map((r) => r.interno), ["admin", "conserje", "propietario"])
})

test("el token es opaco, único y se guarda solo como SHA-256", () => {
  const a = generarToken()
  const b = generarToken()
  assert.notEqual(a, b)
  assert.equal(tokenConFormatoValido(a), true)
  assert.equal(tokenConFormatoValido("corto"), false)
  assert.equal(tokenConFormatoValido(a + "x"), false)
  assert.match(hashToken(a), /^[0-9a-f]{64}$/)
  assert.notEqual(hashToken(a), hashToken(b))
})

test("la huella de IP es estable, depende del secreto y no contiene la IP", () => {
  const h1 = huellaIp("200.1.2.3", "secreto-1")
  assert.equal(h1, huellaIp(" 200.1.2.3 ", "secreto-1"))
  assert.notEqual(h1, huellaIp("200.1.2.3", "secreto-2"))
  assert.notEqual(h1, huellaIp("200.1.2.4", "secreto-1"))
  assert.match(h1, /^[0-9a-f]{64}$/)
  assert.equal(h1.includes("200"), false)
  assert.throws(() => huellaIp("1.1.1.1", ""))
})

test("la sesión demo se reconoce solo por app_metadata (no editable por el usuario)", () => {
  assert.equal(esUsuarioDemo({ app_metadata: { demo: true } }), true)
  assert.equal(esUsuarioDemo({ app_metadata: { demo: "true" } }), false)
  assert.equal(esUsuarioDemo({ app_metadata: {} }), false)
  assert.equal(esUsuarioDemo(null), false)
  assert.equal(esUsuarioDemo({ user_metadata: { demo: true } } as never), false)
})

test("correo y etiquetas", () => {
  assert.equal(correoDemo("abc"), "demo-abc@demo.invalid")
  assert.equal(etiquetaRolInterno("propietario"), "Residente")
  assert.equal(etiquetaRolInterno("super_admin"), "Visitante")
})
