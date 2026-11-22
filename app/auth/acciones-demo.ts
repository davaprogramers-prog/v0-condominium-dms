"use server"

import { MENSAJE_NO_DISPONIBLE, esRolDemo } from "@/lib/demo/reglas"
import { cerrarSesionDemo, iniciarSesionDemo, type ResultadoDemo } from "@/lib/demo/servicio"

export async function entrarDemo(rol: unknown): Promise<ResultadoDemo> {
  if (!esRolDemo(rol)) return { ok: false, error: "Elige un rol válido." }
  try {
    return await iniciarSesionDemo(rol)
  } catch (err) {
    console.error("[demo] error al entrar:", (err as Error).message)
    return { ok: false, error: MENSAJE_NO_DISPONIBLE }
  }
}

export async function salirDemo(): Promise<{ ok: true }> {
  try {
    await cerrarSesionDemo()
  } catch (err) {
    console.error("[demo] error al salir:", (err as Error).message)
  }
  return { ok: true }
}
