import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { MENSAJE_ACCION_BLOQUEADA, esUsuarioDemo } from "./reglas"

export class ErrorAccionDemo extends Error {
  constructor() {
    super(MENSAJE_ACCION_BLOQUEADA)
    this.name = "ErrorAccionDemo"
  }
}

/** true si la petición viene de una sesión demo. Lee el usuario verificado por Supabase Auth. */
export async function sesionEsDemo(): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  return esUsuarioDemo(data.user)
}

/**
 * Para acciones con clave de servicio (saltan RLS): la demo no debe ejecutarlas.
 * Lanza ErrorAccionDemo, cuyo mensaje es apto para mostrar al usuario.
 */
export async function exigirNoDemo(): Promise<void> {
  if (await sesionEsDemo()) throw new ErrorAccionDemo()
}

export function respuestaAccionDemo() {
  return NextResponse.json({ error: MENSAJE_ACCION_BLOQUEADA }, { status: 403 })
}
