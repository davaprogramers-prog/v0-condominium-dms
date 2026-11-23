import { test } from "node:test"
import assert from "node:assert/strict"
import { demoPuedeEditar, fechaChile } from "../lib/demo/edicion"
import { puedeRechazarReservas } from "../lib/reservas/permisos"

test("rechazar reservas: solo administrador o super admin efectivo", () => {
  assert.equal(puedeRechazarReservas("admin", false), true)
  assert.equal(puedeRechazarReservas("super_admin", true), true)
  assert.equal(puedeRechazarReservas("super_admin", false), false)
  assert.equal(puedeRechazarReservas("conserje", false), false)
  assert.equal(puedeRechazarReservas("propietario", false), false)
  assert.equal(puedeRechazarReservas(null, false), false)
})

test("fecha en hora de Chile, no UTC", () => {
  // 02:00 UTC del 23-11 = 23:00 del 22-11 en Chile (verano, UTC-3)
  assert.equal(fechaChile("2026-11-23T02:00:00Z"), "2026-11-22")
})

test("demo: solo edita lo propio creado hoy", () => {
  const ahora = new Date("2026-11-22T15:00:00Z")
  const yo = "u1"
  assert.equal(demoPuedeEditar({ created_by: yo, created_at: "2026-11-22T12:00:00Z" }, yo, ahora), true)
  assert.equal(demoPuedeEditar({ created_by: "otro", created_at: "2026-11-22T12:00:00Z" }, yo, ahora), false)
  assert.equal(demoPuedeEditar({ created_by: yo, created_at: "2026-11-21T12:00:00Z" }, yo, ahora), false)
  assert.equal(demoPuedeEditar({ created_by: null, created_at: "2026-11-22T12:00:00Z" }, yo, ahora), false)
  assert.equal(demoPuedeEditar({}, yo, ahora), false)
})
