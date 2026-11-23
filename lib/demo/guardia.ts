import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { MENSAJE_ACCION_BLOQUEADA, MENSAJE_EDICION_DEMO, MENSAJE_ELIMINAR_DEMO, esUsuarioDemo } from "./reglas"

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

export class ErrorEdicionDemo extends Error {
  constructor() {
    super(MENSAJE_EDICION_DEMO)
    this.name = "ErrorEdicionDemo"
  }
}

/**
 * Para acciones con clave de servicio que MODIFICAN una fila: en la demo solo se permite si la creó
 * el mismo usuario hoy (hora de Chile). Misma regla que la política demo_editar_propio_hoy (scripts/155).
 */
export async function exigirEdicionDemoPermitida(tabla: string, filaId: string): Promise<void> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!esUsuarioDemo(data.user)) return
  const { data: permitido, error } = await createServiceClient().rpc("fn_demo_puede_editar_usuario", {
    p_tabla: tabla,
    p_id: filaId,
    p_user: data.user!.id,
  })
  if (error || permitido !== true) throw new ErrorEdicionDemo()
}

/** Eliminar o cancelar (borrado lógico) nunca está disponible en la demo. */
export async function exigirNoEliminarDemo(): Promise<void> {
  if (await sesionEsDemo()) throw new Error(MENSAJE_ELIMINAR_DEMO)
}

export function respuestaAccionDemo() {
  return NextResponse.json({ error: MENSAJE_ACCION_BLOQUEADA }, { status: 403 })
}
