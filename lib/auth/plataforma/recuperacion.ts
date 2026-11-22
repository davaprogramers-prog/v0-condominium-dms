import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto"

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
export const CANTIDAD_CODIGOS = 10

export function generarCodigo(): string {
  const bytes = randomBytes(10)
  let s = ""
  for (const b of bytes) s += ALFABETO[b % ALFABETO.length]
  return `${s.slice(0, 5)}-${s.slice(5, 10)}`
}

export function generarCodigos(n = CANTIDAD_CODIGOS): string[] {
  const set = new Set<string>()
  while (set.size < n) set.add(generarCodigo())
  return [...set]
}

export function normalizarCodigo(c: string): string {
  return c.toUpperCase().replace(/[^A-Z0-9]/g, "")
}

export function hashCodigo(codigo: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(normalizarCodigo(codigo), salt, 32)
  return `${salt.toString("hex")}:${hash.toString("hex")}`
}

export function codigoCoincide(codigo: string, almacenado: string): boolean {
  const [saltHex, hashHex] = almacenado.split(":")
  if (!saltHex || !hashHex) return false
  const esperado = Buffer.from(hashHex, "hex")
  const calculado = scryptSync(normalizarCodigo(codigo), Buffer.from(saltHex, "hex"), esperado.length)
  return esperado.length === calculado.length && timingSafeEqual(esperado, calculado)
}

/** Comparación en tiempo constante de secretos de largo arbitrario. */
export function secretosIguales(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest()
  const hb = createHash("sha256").update(b, "utf8").digest()
  return timingSafeEqual(ha, hb) && a.length === b.length
}
