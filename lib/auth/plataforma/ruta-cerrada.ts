import { NextResponse } from "next/server"

/** Rutas de mantenimiento retiradas: las migraciones se aplican desde scripts/, nunca por HTTP. */
export function rutaCerrada() {
  return NextResponse.json(
    { error: "Esta ruta fue retirada. Las tareas de mantenimiento se aplican desde scripts del servidor." },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  )
}
