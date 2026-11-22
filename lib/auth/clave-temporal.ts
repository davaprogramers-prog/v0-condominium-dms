import { randomInt } from "node:crypto"

// Sin caracteres ambiguos (0/O, 1/l/I) para dictarla por teléfono sin errores.
const MAYUSCULAS = "ABCDEFGHJKLMNPQRSTUVWXYZ"
const MINUSCULAS = "abcdefghijkmnopqrstuvwxyz"
const DIGITOS = "23456789"
const SIMBOLOS = "@#$%&*!?"
const TODOS = MAYUSCULAS + MINUSCULAS + DIGITOS + SIMBOLOS

const elegir = (conjunto: string) => conjunto[randomInt(conjunto.length)]

/** Clave temporal aleatoria (CSPRNG) con al menos una mayúscula, minúscula, dígito y símbolo. */
export function generarClaveTemporal(largo = 14): string {
  if (largo < 8) throw new Error("La clave temporal debe tener al menos 8 caracteres")
  const caracteres = [elegir(MAYUSCULAS), elegir(MINUSCULAS), elegir(DIGITOS), elegir(SIMBOLOS)]
  while (caracteres.length < largo) caracteres.push(elegir(TODOS))
  for (let i = caracteres.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]]
  }
  return caracteres.join("")
}
